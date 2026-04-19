import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import CommissionLog from "@/models/CommissionLog";
import { buildDataFilter } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();

  if (req.method === "GET") {
    const filter = buildDataFilter(session);
    
    // Aggregation pipeline to get monthly totals
    const monthlyStats = await CommissionLog.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: "$month",
          totalCommission: { $sum: "$commissionAmount" },
          totalPaidPremium: { $sum: "$paidAmount" },
          pendingCommission: { 
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$commissionAmount", 0] } 
          },
          paidCommission: { 
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$commissionAmount", 0] } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const byStatus = await CommissionLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          amount: { $sum: "$commissionAmount" }
        }
      }
    ]);

    // Format output
    const statusBreakdown = {
      pending: byStatus.find(s => s._id === "pending")?.amount || 0,
      paid: byStatus.find(s => s._id === "paid")?.amount || 0,
      adjusted: byStatus.find(s => s._id === "adjusted")?.amount || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        monthly: monthlyStats,
        statusBreakdown,
      }
    });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const GET = withApiHandler(handler, true);
