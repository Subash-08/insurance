import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Premium from "@/models/Premium";
import Policy from "@/models/Policy";
import Client from "@/models/Client";
import User from "@/models/User";
import Insurer from "@/models/Insurer";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const mode = searchParams.get("mode");
    const month = searchParams.get("month");
    const groupByDate = searchParams.get("groupByDate") === "true";

    const filter: any = {};
    if (session.user.role !== "owner") {
      filter.agentId = session.user.id;
    }

    if (status && status !== "all") {
      if (status === "unpaid") {
        filter.status = { $in: ["upcoming", "due", "overdue", "partially_paid", "ecs_pending"] };
      } else {
        filter.status = status;
      }
    }

    if (month) {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      filter.dueDate = { $gte: start, $lt: end };
    }

    if (search || groupByDate) {
      const pipeline: any[] = [
        { $match: filter },
        {
          $lookup: {
            from: "clients",
            localField: "clientId",
            foreignField: "_id",
            as: "client"
          }
        },
        { $unwind: "$client" },
        {
          $lookup: {
            from: "policies",
            localField: "policyId",
            foreignField: "_id",
            as: "policy"
          }
        },
        { $unwind: "$policy" }
      ];

      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { "client.name": { $regex: search, $options: "i" } },
              { "policy.policyNumber": { $regex: search, $options: "i" } }
            ]
          }
        });
      }

      if (groupByDate) {
        // Calendar view 
        pipeline.push({
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$dueDate" } },
            totalExpected: { $sum: "$amount" },
            totalCollected: { $sum: "$paidAmount" },
            pendingCount: {
              $sum: {
                $cond: [{ $in: ["$status", ["upcoming", "due", "overdue", "partially_paid", "ecs_pending"]] }, 1, 0]
              }
            },
            premiums: { $push: "$$ROOT" }
          }
        });

        const calendarData = await Premium.aggregate(pipeline);
        return NextResponse.json({ success: true, data: calendarData });
      } else {
        const totalPipeline = [...pipeline, { $count: "total" }];
        const totalResult = await Premium.aggregate(totalPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        pipeline.push({ $sort: { dueDate: 1 } });
        pipeline.push({ $skip: (page - 1) * limit });
        pipeline.push({ $limit: limit });

        const data = await Premium.aggregate(pipeline);

        await Premium.populate(data, { path: "policy.insurerId", model: Insurer });
        await Premium.populate(data, { path: "agentId", model: User });

        // Map aggregated docs to typical populated structure
        const mappedData = data.map(d => ({
          ...d,
          clientId: d.client,
          policyId: d.policy
        }));

        return NextResponse.json({ success: true, data: mappedData, pagination: { page, limit, total } });
      }
    } else {
      const total = await Premium.countDocuments(filter);
      const data = await Premium.find(filter)
        .sort({ dueDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "clientId", model: Client, select: "name mobile" })
        .populate({
          path: "policyId",
          model: Policy,
          select: "policyNumber type insurerId",
          populate: { path: "insurerId", model: Insurer, select: "name logoUrl" }
        })
        .populate({ path: "agentId", model: User, select: "name" })
        .lean();

      return NextResponse.json({ success: true, data, pagination: { page, limit, total } });
    }
  } catch (error: any) {
    console.error("[PREMIUMS_GET]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
