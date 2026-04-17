import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import Policy from "@/models/Policy";
import Premium from "@/models/Premium";
import Claim from "@/models/Claim";
import User from "@/models/User";
import CommissionLog from "@/models/CommissionLog";
import Lead from "@/models/Lead";
import mongoose from "mongoose";

// ── IST date helpers ──────────────────────────────────────────────────────────
function getISTBounds() {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000; // UTC+5:30 in ms
  const nowUTC = Date.now();
  const nowIST = new Date(nowUTC + IST_OFFSET);

  // Start of today in IST → convert back to UTC for Mongo query
  const todayIST = new Date(nowIST);
  todayIST.setUTCHours(0, 0, 0, 0);
  const todayStartUTC = new Date(todayIST.getTime() - IST_OFFSET);

  // Start of current month in IST
  const somIST = new Date(nowIST);
  somIST.setUTCDate(1);
  somIST.setUTCHours(0, 0, 0, 0);
  const somUTC = new Date(somIST.getTime() - IST_OFFSET);

  // End of today IST
  const todayEndUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  // 30 days from today
  const plus30 = new Date(todayStartUTC.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Previous month bounds
  const prevSomIST = new Date(somIST);
  prevSomIST.setUTCMonth(prevSomIST.getUTCMonth() - 1);
  const prevEomIST = new Date(somIST.getTime() - 1);
  const prevSomUTC = new Date(prevSomIST.getTime() - IST_OFFSET);
  const prevEomUTC = new Date(prevEomIST.getTime() - IST_OFFSET);

  return { todayStartUTC, todayEndUTC, somUTC, plus30, prevSomUTC, prevEomUTC, nowUTC: new Date(nowUTC) };
}

// ── Module-level cache ────────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; cachedAt: number }>();

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.cachedAt < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key: string, data: unknown) {
  if (cache.size > 100) cache.clear();
  cache.set(key, { data, cachedAt: Date.now() });
}

// ── Aggregation helper: single-facet count/sum normalizer ─────────────────────
function countOf(facetResult: { total?: number }[]): number {
  return facetResult[0]?.total ?? 0;
}

function sumOf(facetResult: { total?: number }[]): number {
  return facetResult[0]?.total ?? 0;
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (token.status !== "active") return NextResponse.json({ success: false, error: "Account not active" }, { status: 403 });

  const userId = token.id as string;
  const role = token.role as string;
  const refresh = req.nextUrl.searchParams.get("refresh") === "true";

  const cacheKey = `${userId}_${role}_stats`;
  if (!refresh) {
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached, fromCache: true });
  }

  await dbConnect();

  const { todayStartUTC, somUTC, plus30, prevSomUTC, prevEomUTC, nowUTC } = getISTBounds();

  // ── Data filter: owner sees all, employee sees only own ─────────────────────
  const agentFilter = role === "owner" ? {} : { agentId: new mongoose.Types.ObjectId(userId) };
  const agentFilterPremium = role === "owner" ? {} : { agentId: new mongoose.Types.ObjectId(userId) };

  try {
    // ── Main $facet aggregation on Premium (most KPIs origin here) ────────────
    const [premiumFacets] = await Premium.aggregate([
      { $match: agentFilterPremium },
      {
        $facet: {
          // Premium collected this month: sum paidAmount where paidAmount > 0 AND lastPaymentDate in range
          // We use $unwind paymentHistory to be time-accurate
          premiumCollectedThisMonth: [
            { $unwind: "$paymentHistory" },
            {
              $match: {
                "paymentHistory.isBounced": false,
                "paymentHistory.date": { $gte: somUTC, $lte: nowUTC },
              },
            },
            { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
          ],
          premiumCollectedPrevMonth: [
            { $unwind: "$paymentHistory" },
            {
              $match: {
                "paymentHistory.isBounced": false,
                "paymentHistory.date": { $gte: prevSomUTC, $lte: prevEomUTC },
              },
            },
            { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
          ],
          // Overdue: status=overdue means dueDate < grace period end. Use balanceAmount (not amount)
          overdueCount: [
            { $match: { status: "overdue" } },
            { $count: "total" },
          ],
          overdueAmount: [
            { $match: { status: "overdue" } },
            { $group: { _id: null, total: { $sum: "$balanceAmount" } } },
          ],
          // Premiums due today
          dueTodayCount: [
            {
              $match: {
                status: { $in: ["due", "overdue", "partially_paid"] },
                dueDate: { $gte: todayStartUTC, $lte: new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000) },
              },
            },
            { $count: "total" },
          ],
          // Premiums due in this month (expected)
          expectedThisMonth: [
            {
              $match: {
                status: { $nin: ["waived", "cancelled"] },
                dueDate: { $gte: somUTC, $lte: nowUTC },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ],
          // Top 5 defaulters: balanceAmount * daysOverdue proxy (sort by balanceAmount desc)
          topDefaulters: [
            { $match: { status: "overdue" } },
            {
              $addFields: {
                daysOverdue: {
                  $floor: {
                    $divide: [{ $subtract: [nowUTC, "$dueDate"] }, 86400000],
                  },
                },
                riskScore: {
                  $multiply: [
                    "$balanceAmount",
                    {
                      $max: [
                        1,
                        { $floor: { $divide: [{ $subtract: [nowUTC, "$dueDate"] }, 86400000] } },
                      ],
                    },
                  ],
                },
              },
            },
            { $sort: { riskScore: -1 } },
            { $limit: 5 },
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
                pipeline: [{ $project: { policyNumber: 1, type: 1 } }],
                as: "policy",
              },
            },
            {
              $project: {
                clientId: 1,
                balanceAmount: 1,
                daysOverdue: 1,
                riskScore: 1,
                clientName: { $arrayElemAt: ["$client.fullName", 0] },
                clientPhone: { $arrayElemAt: ["$client.phone", 0] },
                policyNumber: { $arrayElemAt: ["$policy.policyNumber", 0] },
                policyType: { $arrayElemAt: ["$policy.type", 0] },
              },
            },
          ],
        },
      },
    ]);

    // ── Policy aggregation ─────────────────────────────────────────────────────
    const [policyFacets] = await Policy.aggregate([
      { $match: agentFilter },
      {
        $facet: {
          activePolicies: [{ $match: { status: "active" } }, { $count: "total" }],
          expiringIn30Days: [
            {
              $match: {
                status: "active",
                $or: [
                  { expiryDate: { $gte: todayStartUTC, $lte: plus30 } },
                  { maturityDate: { $gte: todayStartUTC, $lte: plus30 } },
                ],
              },
            },
            { $count: "total" },
          ],
          activePoliciesPrevMonth: [
            {
              $match: {
                status: "active",
                createdAt: { $lte: prevEomUTC },
              },
            },
            { $count: "total" },
          ],
        },
      },
    ]);

    // ── Client aggregation ─────────────────────────────────────────────────────
    const [clientFacets] = await Client.aggregate([
      { $match: agentFilter },
      {
        $facet: {
          activeClients: [{ $match: { isActive: true } }, { $count: "total" }],
          newClientsThisMonth: [
            { $match: { createdAt: { $gte: somUTC } } },
            { $count: "total" },
          ],
          newClientsPrevMonth: [
            { $match: { createdAt: { $gte: prevSomUTC, $lte: prevEomUTC } } },
            { $count: "total" },
          ],
          activeClientsPrevMonth: [
            { $match: { isActive: true, createdAt: { $lte: prevEomUTC } } },
            { $count: "total" },
          ],
        },
      },
    ]);

    // ── Claims aggregation ─────────────────────────────────────────────────────
    const [claimFacets] = await Claim.aggregate([
      { $match: agentFilter },
      {
        $facet: {
          openClaimsCount: [
            { $match: { status: { $nin: ["closed", "rejected", "settled"] } } },
            { $count: "total" },
          ],
        },
      },
    ]);

    // ── Owner-only data ────────────────────────────────────────────────────────
    let ownerOnly: Record<string, unknown> = {};
    if (role === "owner") {
      const pendingApprovals = await User.countDocuments({ role: "employee", status: "pending_approval" });

      // Per-agent performance (current month)
      const agentPerformance = await User.aggregate([
        { $match: { role: "employee", status: "active" } },
        {
          $lookup: {
            from: "clients",
            let: { agentId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$agentId", "$$agentId"] }, createdAt: { $gte: somUTC } } },
              { $count: "total" },
            ],
            as: "clientsAdded",
          },
        },
        {
          $lookup: {
            from: "policies",
            let: { agentId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$agentId", "$$agentId"] }, createdAt: { $gte: somUTC } } },
              { $count: "total" },
            ],
            as: "policiesAdded",
          },
        },
        {
          $lookup: {
            from: "premiums",
            let: { agentId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$agentId", "$$agentId"] } } },
              { $unwind: "$paymentHistory" },
              {
                $match: {
                  "paymentHistory.isBounced": false,
                  "paymentHistory.date": { $gte: somUTC, $lte: nowUTC },
                },
              },
              { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
            ],
            as: "premiumCollected",
          },
        },
        {
          $lookup: {
            from: "commissionlogs",
            let: { agentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$agentId", "$$agentId"] },
                  month: {
                    $gte: `${somUTC.getUTCFullYear()}-${String(somUTC.getUTCMonth() + 1).padStart(2, "0")}`,
                  },
                },
              },
              { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
            ],
            as: "commission",
          },
        },
        {
          $lookup: {
            from: "leads",
            let: { agentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$agentId", "$$agentId"] },
                  status: { $nin: ["converted", "lost"] },
                },
              },
              { $count: "total" },
            ],
            as: "activeLeads",
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            designation: 1,
            profilePhoto: 1,
            lastLoginAt: 1,
            clientsAdded: { $ifNull: [{ $arrayElemAt: ["$clientsAdded.total", 0] }, 0] },
            policiesAdded: { $ifNull: [{ $arrayElemAt: ["$policiesAdded.total", 0] }, 0] },
            premiumCollected: { $ifNull: [{ $arrayElemAt: ["$premiumCollected.total", 0] }, 0] },
            commission: { $ifNull: [{ $arrayElemAt: ["$commission.total", 0] }, 0] },
            activeLeads: { $ifNull: [{ $arrayElemAt: ["$activeLeads.total", 0] }, 0] },
          },
        },
      ]);

      ownerOnly = { pendingApprovals, agentPerformance };
    }

    // ── Lead stats (own for employee / all for owner) ─────────────────────────
    const leadFilter = role === "owner" ? {} : { agentId: new mongoose.Types.ObjectId(userId) };
    const [activeLeadsCount, prevLeadsCount] = await Promise.all([
      Lead.countDocuments({ ...leadFilter, status: { $nin: ["converted", "lost"] } }),
      Lead.countDocuments({
        ...leadFilter,
        status: { $nin: ["converted", "lost"] },
        createdAt: { $lte: prevEomUTC },
      }),
    ]);

    // ── Collection efficiency ─────────────────────────────────────────────────
    const expectedThisMonth = sumOf(premiumFacets.expectedThisMonth);
    const collectedThisMonth = sumOf(premiumFacets.premiumCollectedThisMonth);
    const collectionEfficiency =
      expectedThisMonth > 0 ? Math.round((collectedThisMonth / expectedThisMonth) * 100) : 0;

    // ── Trend calculator: % change over previous period ───────────────────────
    const trend = (current: number, previous: number) => {
      if (previous === 0) return { direction: "neutral" as const, pct: 0 };
      const pct = Math.round(((current - previous) / previous) * 100);
      return { direction: pct >= 0 ? ("up" as const) : ("down" as const), pct: Math.abs(pct) };
    };

    const responseData = {
      kpis: {
        activeClients: {
          current: countOf(clientFacets.activeClients),
          trend: trend(countOf(clientFacets.activeClients), countOf(clientFacets.activeClientsPrevMonth)),
        },
        activePolicies: {
          current: countOf(policyFacets.activePolicies),
          trend: trend(countOf(policyFacets.activePolicies), countOf(policyFacets.activePoliciesPrevMonth)),
        },
        premiumCollectedThisMonth: {
          current: collectedThisMonth,
          previous: sumOf(premiumFacets.premiumCollectedPrevMonth),
          trend: trend(collectedThisMonth, sumOf(premiumFacets.premiumCollectedPrevMonth)),
        },
        expiringIn30Days: { current: countOf(policyFacets.expiringIn30Days) },
        openClaimsCount: { current: countOf(claimFacets.openClaimsCount) },
        overdueCount: {
          current: countOf(premiumFacets.overdueCount),
          trend: trend(countOf(premiumFacets.overdueCount), 0),
        },
        overdueAmount: { current: sumOf(premiumFacets.overdueAmount) },
        newClientsThisMonth: {
          current: countOf(clientFacets.newClientsThisMonth),
          trend: trend(countOf(clientFacets.newClientsThisMonth), countOf(clientFacets.newClientsPrevMonth)),
        },
        activeLeads: {
          current: activeLeadsCount,
          trend: trend(activeLeadsCount, prevLeadsCount),
        },
        dueTodayCount: { current: countOf(premiumFacets.dueTodayCount) },
        collectionEfficiency: { current: collectionEfficiency },
      },
      topDefaulters: premiumFacets.topDefaulters ?? [],
      ...ownerOnly,
    };

    setCache(cacheKey, responseData);
    return NextResponse.json({ success: true, data: responseData });
  } catch (err) {
    console.error("[DASHBOARD_STATS]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
