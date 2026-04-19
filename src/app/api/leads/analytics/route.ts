import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { buildDataFilter } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();

  if (req.method === "GET") {
    const filter = buildDataFilter(session);
    
    // Aggregate by stage
    const stageCounts = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: "$stage", count: { $sum: 1 }, pipelineValue: { $sum: "$estimatedSumAssured" } } },
    ]);

    const stats = {
      new_inquiry: { count: 0, value: 0 },
      contacted: { count: 0, value: 0 },
      proposal_sent: { count: 0, value: 0 },
      negotiation: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 },
      staleLeads: 0,
      totalPipeline: 0
    };

    stageCounts.forEach((stage) => {
      if (stats[stage._id as keyof typeof stats]) {
        (stats[stage._id as keyof typeof stats] as any) = {
          count: stage.count,
          value: stage.pipelineValue || 0,
        };
        if (stage._id !== "won" && stage._id !== "lost") {
          stats.totalPipeline += stage.pipelineValue || 0;
        }
      }
    });

    // Count stale leads (not contacted in > 3 days) and not won/lost
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 3);

    stats.staleLeads = await Lead.countDocuments({
      ...filter,
      stage: { $nin: ["won", "lost"] },
      $or: [
        { lastContactedAt: { $lt: staleDate } },
        { lastContactedAt: { $exists: false } }
      ]
    });

    return NextResponse.json({ success: true, stats });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const GET = withApiHandler(handler, true);
