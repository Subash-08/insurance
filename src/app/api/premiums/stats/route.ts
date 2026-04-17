import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Premium from "@/models/Premium";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const filter: any = {};
    if (session.user.role !== "owner") {
      filter.agentId = session.user.id;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Using facet to fetch everything efficiently
    // We isolate match rules accurately mapping against the new schema rules.
    const statsData = await Premium.aggregate([
      { $match: filter },
      {
        $facet: {
          dueToday: [
            {
              $match: {
                dueDate: today,
                status: { $in: ["upcoming", "due", "overdue", "partially_paid", "ecs_pending"] }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
                totalBalance: { $sum: "$balanceAmount" }
              }
            }
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: today },
                status: { $in: ["due", "overdue", "partially_paid", "ecs_pending"] }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
                totalBalance: { $sum: "$balanceAmount" }
              }
            }
          ],
          collectedThisMonth: [
            {
              $unwind: "$paymentHistory"
            },
            {
              $match: {
                "paymentHistory.date": { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth },
                "paymentHistory.isBounced": false
              }
            },
            {
              $group: {
                _id: null,
                totalCollected: { $sum: "$paymentHistory.amount" }
              }
            }
          ],
          expectedThisMonth: [
            {
              $match: {
                dueDate: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth },
                status: { $nin: ["waived", "cancelled"] }
              }
            },
            {
              $group: {
                _id: null,
                totalExpected: { $sum: "$amount" }
              }
            }
          ],
          upcoming: [
            {
              $match: {
                dueDate: { $gt: today, $lte: thirtyDaysFromNow },
                status: { $in: ["upcoming", "partially_paid", "ecs_pending"] }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const result = statsData[0] || {};

    return NextResponse.json({
      success: true,
      stats: {
        dueToday: {
          count: result.dueToday?.[0]?.count || 0,
          total: result.dueToday?.[0]?.totalBalance || 0
        },
        overdue: {
          count: result.overdue?.[0]?.count || 0,
          total: result.overdue?.[0]?.totalBalance || 0
        },
        collectedThisMonth: result.collectedThisMonth?.[0]?.totalCollected || 0,
        expectedThisMonth: result.expectedThisMonth?.[0]?.totalExpected || 0,
        upcomingCount: result.upcoming?.[0]?.count || 0
      }
    });

  } catch (error: any) {
    console.error("[PREMIUMS_STATS_GET]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
