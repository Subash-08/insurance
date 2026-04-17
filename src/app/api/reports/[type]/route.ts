import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/mongodb";
import Policy from "@/models/Policy";
import Premium from "@/models/Premium";
import CommissionLog from "@/models/CommissionLog";
import mongoose from "mongoose";

const MAX_EXPORT_LIMIT = 1000;

export async function GET(req: NextRequest, { params }: { params: { type: string } }) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (token.status !== "active") return NextResponse.json({ success: false, error: "Account not active" }, { status: 403 });

  const userId = token.id as string;
  const role = token.role as string;
  const type = params.type;

  // Query params
  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") || "30_days"; // "7_days", "30_days", "90_days", "this_month", "last_month", "custom"
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");
  const fetchLimit = searchParams.get("export") === "true" ? MAX_EXPORT_LIMIT : 50; // View limit vs export limit

  await dbConnect();

  const agentFilter = role === "owner" ? {} : { agentId: new mongoose.Types.ObjectId(userId) };

  // Date parsing
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  let startDate: Date;
  let endDate: Date;

  const nowUTC = Date.now();
  const nowIST = new Date(nowUTC + IST_OFFSET);
  
  if (period === "custom" && startParam && endParam) {
    startDate = new Date(startParam);
    endDate = new Date(endParam);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (period === "this_month") {
    const startIST = new Date(nowIST);
    startIST.setUTCDate(1);
    startIST.setUTCHours(0, 0, 0, 0);
    startDate = new Date(startIST.getTime() - IST_OFFSET);
    endDate = new Date();
  } else if (period === "last_month") {
    const startIST = new Date(nowIST);
    startIST.setUTCMonth(startIST.getUTCMonth() - 1);
    startIST.setUTCDate(1);
    startIST.setUTCHours(0, 0, 0, 0);
    startDate = new Date(startIST.getTime() - IST_OFFSET);
    
    const endIST = new Date(startIST);
    endIST.setUTCMonth(endIST.getUTCMonth() + 1);
    endIST.setUTCDate(0);
    endIST.setUTCHours(23, 59, 59, 999);
    endDate = new Date(endIST.getTime() - IST_OFFSET);
  } else {
    // days back or forward logic
    const days = parseInt(period.split("_")[0]) || 30;
    
    if (type === "expiry") {
      // Expiry is forward looking
      startDate = new Date();
      startDate.setUTCHours(0,0,0,0);
      endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      endDate.setUTCHours(23,59,59,999);
    } else {
      // Past looking
      endDate = new Date();
      startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(0, 0, 0, 0);
    }
  }

  try {
    let data: any[] = [];
    let summary: any = {};

    switch (type) {
      case "expiry":
        // Policies expiring between startDate and endDate
        data = await Policy.find({
          ...agentFilter,
          status: "active",
          $or: [
            { expiryDate: { $gte: startDate, $lte: endDate } },
            { maturityDate: { $gte: startDate, $lte: endDate } }
          ]
        })
          .populate("clientId", "fullName phone")
          .populate("insurerId", "name")
          .populate("agentId", "name")
          .sort({ expiryDate: 1, maturityDate: 1 })
          .limit(fetchLimit)
          .lean();

        data = data.map((d: any) => ({
          _id: d._id,
          clientName: d.clientId?.fullName,
          phone: d.clientId?.phone,
          policyNumber: d.policyNumber,
          insurer: d.insurerId?.name,
          type: d.type,
          sumAssured: d.sumAssured,
          totalPremium: d.premiumAmount,
          endDate: d.expiryDate || d.maturityDate,
          agentName: d.agentId?.name,
        }));
        
        summary = {
          count: data.length,
          totalSumAssured: data.reduce((acc, curr) => acc + (curr.sumAssured || 0), 0),
          totalPremium: data.reduce((acc, curr) => acc + (curr.totalPremium || 0), 0)
        };
        break;

      case "premium_collections":
        // unwind paymentHistory and match dates
        const premiumRaw = await Premium.aggregate([
          { $match: agentFilter },
          { $unwind: "$paymentHistory" },
          {
            $match: {
              "paymentHistory.isBounced": false,
              "paymentHistory.date": { $gte: startDate, $lte: endDate },
            },
          },
          { $sort: { "paymentHistory.date": -1 } },
          { $limit: fetchLimit },
          {
            $lookup: {
              from: "clients",
              localField: "clientId",
              foreignField: "_id",
              pipeline: [{ $project: { fullName: 1, phone: 1 } }],
              as: "client",
            },
          },
          {
            $lookup: {
              from: "policies",
              localField: "policyId",
              foreignField: "_id",
              pipeline: [{ $project: { policyNumber: 1, type: 1, insurerId: 1 } }],
              as: "policy",
            },
          },
          // need another lookup for insurer if we want insurer name, or we can just fetch it manually if needed, 
          // let's do a nested lookup or just return standard
          {
            $lookup: {
              from: "users",
              localField: "agentId",
              foreignField: "_id",
              pipeline: [{ $project: { name: 1 } }],
              as: "agent",
            },
          },
          {
            $project: {
              paidDate: "$paymentHistory.date",
              amount: "$paymentHistory.amount",
              mode: "$paymentHistory.mode",
              receiptNumber: "$paymentHistory.receiptNumber",
              clientName: { $arrayElemAt: ["$client.fullName", 0] },
              clientPhone: { $arrayElemAt: ["$client.phone", 0] },
              policyNumber: { $arrayElemAt: ["$policy.policyNumber", 0] },
              policyType: { $arrayElemAt: ["$policy.type", 0] },
              agentName: { $arrayElemAt: ["$agent.name", 0] },
              // Note: We'd need Insurer lookup here but to avoid complex nested lookups we can do it in a second pass or basic projection
            },
          },
        ]);
        
        data = premiumRaw;
        summary = {
          count: data.length,
          totalCollected: data.reduce((acc, curr) => acc + (curr.amount || 0), 0),
        };
        break;

      case "lapse_risk":
        // Overdue premiums, past grace period
        // CRITICAL FIX: To prevent overdue showing before dueDate, we check dueDate < today
        // Lapse risk means > X days overdue. Let's say all overdue
        const nowUTCDt = new Date();
        data = await Premium.aggregate([
          { 
            $match: { 
              ...agentFilter, 
              status: "overdue",
              dueDate: { $lt: nowUTCDt } 
            } 
          },
          {
            $addFields: {
              daysOverdue: {
                $floor: { $divide: [{ $subtract: [nowUTCDt, "$dueDate"] }, 86400000] },
              },
            },
          },
          { $sort: { daysOverdue: -1 } },
          { $limit: fetchLimit },
          {
            $lookup: {
              from: "clients",
              localField: "clientId",
              foreignField: "_id",
              pipeline: [{ $project: { fullName: 1, phone: 1 } }],
              as: "client",
            },
          },
          {
            $lookup: {
              from: "policies",
              localField: "policyId",
              foreignField: "_id",
              pipeline: [{ $project: { policyNumber: 1, type: 1, sumAssured: 1 } }],
              as: "policy",
            },
          },
          {
            $lookup: {
              from: "users", // agent
              localField: "agentId",
              foreignField: "_id",
              pipeline: [{ $project: { name: 1 } }],
              as: "agent",
            },
          },
          {
            $project: {
              _id: 1,
              dueDate: 1,
              amount: "$balanceAmount", // amount pending
              daysOverdue: 1,
              clientName: { $arrayElemAt: ["$client.fullName", 0] },
              phone: { $arrayElemAt: ["$client.phone", 0] },
              policyNumber: { $arrayElemAt: ["$policy.policyNumber", 0] },
              type: { $arrayElemAt: ["$policy.type", 0] },
              sumAssured: { $arrayElemAt: ["$policy.sumAssured", 0] },
              agentName: { $arrayElemAt: ["$agent.name", 0] },
            },
          },
        ]);
        
        summary = {
          count: data.length,
          totalAtRiskAmount: data.reduce((acc, curr) => acc + (curr.amount || 0), 0),
        };
        break;

      case "commission":
        data = await CommissionLog.find({
          ...agentFilter,
          createdAt: { $gte: startDate, $lte: endDate }
        })
          .populate({ path: "policyId", select: "policyNumber type", populate: { path: "clientId", select: "fullName" } })
          .populate("agentId", "name")
          .sort({ createdAt: -1 })
          .limit(fetchLimit)
          .lean();
          
        data = data.map((d: any) => ({
          _id: d._id,
          month: d.month,
          policyNumber: d.policyId?.policyNumber,
          clientName: d.policyId?.clientId?.fullName,
          policyType: d.policyId?.type,
          premium: d.premiumAmount,
          rate: d.commissionRate,
          commission: d.commissionAmount,
          status: d.status,
          agentName: d.agentId?.name,
          datePaid: d.paidAt || d.createdAt,
        }));
        
        summary = {
          count: data.length,
          totalCommission: data.reduce((acc, curr) => acc + (curr.commission || 0), 0),
        };
        break;

      default:
        return NextResponse.json({ success: false, error: "Invalid report type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      summary,
      dateRange: { start: startDate, end: endDate },
    });

  } catch (err) {
    console.error(`[REPORTS_API] ${type}`, err);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}
