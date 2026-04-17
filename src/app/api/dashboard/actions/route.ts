import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/mongodb";
import Policy from "@/models/Policy";
import Premium from "@/models/Premium";
import Client from "@/models/Client";
import Lead from "@/models/Lead";
import mongoose from "mongoose";

// ── IST helpers ────────────────────────────────────────────────────────────────
function getISTDates() {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const nowUTC = Date.now();
  const nowIST = new Date(nowUTC + IST_OFFSET);

  // Start of today IST → UTC
  const todayIST = new Date(nowIST);
  todayIST.setUTCHours(0, 0, 0, 0);
  const todayStartUTC = new Date(todayIST.getTime() - IST_OFFSET);
  const todayEndUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  // 7 days from now
  const plus7 = new Date(todayStartUTC.getTime() + 7 * 24 * 60 * 60 * 1000);
  // 90 days from now
  const plus90 = new Date(todayStartUTC.getTime() + 90 * 24 * 60 * 60 * 1000);

  // IST month and day for birthday matching
  const istMonth = nowIST.getUTCMonth() + 1; // 1-12
  const istDay = nowIST.getUTCDate();

  return { todayStartUTC, todayEndUTC, plus7, plus90, istMonth, istDay, nowUTC: new Date(nowUTC) };
}

// ── Cache ──────────────────────────────────────────────────────────────────────
const CACHE_TTL = 3 * 60 * 1000; // 3 min for action data (more time-sensitive)
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

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (token.status !== "active") return NextResponse.json({ success: false, error: "Account not active" }, { status: 403 });

  const userId = token.id as string;
  const role = token.role as string;
  const refresh = req.nextUrl.searchParams.get("refresh") === "true";

  const cacheKey = `${userId}_${role}_actions`;
  if (!refresh) {
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached, fromCache: true });
  }

  await dbConnect();

  const agentFilter = role === "owner" ? {} : { agentId: new mongoose.Types.ObjectId(userId) };
  const { todayStartUTC, todayEndUTC, plus7, plus90, istMonth, istDay, nowUTC } = getISTDates();

  try {
    // ── 1. Renewals this week (policies expiring in next 7 days) ──────────────
    const renewalsThisWeek = await Policy.find({
      ...agentFilter,
      status: "active",
      $or: [
        { expiryDate: { $gte: todayStartUTC, $lte: plus7 } },
        { maturityDate: { $gte: todayStartUTC, $lte: plus7 } },
      ],
    })
      .populate("clientId", "fullName phone")
      .populate("insurerId", "name")
      .sort({ expiryDate: 1 })
      .limit(10)
      .lean();

    // ── 2. Premiums due today ─────────────────────────────────────────────────
    const dueTodayPremiums = await Premium.find({
      ...agentFilter,
      status: { $in: ["due", "overdue", "partially_paid"] },
      dueDate: { $gte: todayStartUTC, $lte: todayEndUTC },
    })
      .populate("clientId", "fullName phone")
      .populate({ path: "policyId", select: "policyNumber type", populate: { path: "insurerId", select: "name" } })
      .limit(10)
      .lean();

    // ── 3. Overdue premiums sorted by days overdue DESC ───────────────────────
    // CRITICAL FIX: status = overdue (means past grace period). dueDate < today.
    const overduePremiums = await Premium.aggregate([
      {
        $match: {
          ...agentFilter,
          status: "overdue",
          dueDate: { $lt: todayStartUTC },
        },
      },
      {
        $addFields: {
          daysOverdue: {
            $floor: { $divide: [{ $subtract: [nowUTC, "$dueDate"] }, 86400000] },
          },
        },
      },
      { $sort: { daysOverdue: -1 } },
      { $limit: 10 },
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
          pipeline: [
            { $project: { policyNumber: 1, type: 1 } },
          ],
          as: "policy",
        },
      },
      {
        $project: {
          dueDate: 1,
          amount: 1,
          balanceAmount: 1,
          daysOverdue: 1,
          clientName: { $arrayElemAt: ["$client.fullName", 0] },
          clientPhone: { $arrayElemAt: ["$client.phone", 0] },
          clientId: 1,
          policyNumber: { $arrayElemAt: ["$policy.policyNumber", 0] },
          policyType: { $arrayElemAt: ["$policy.type", 0] },
          policyId: 1,
        },
      },
    ]);

    // ── 4. Today's birthdays ──────────────────────────────────────────────────
    // CRITICAL FIX: Feb-29 edge case — on non-leap years Feb 29 DOBs → show on Feb 28
    let birthdayMonth = istMonth;
    let birthdayDay = istDay;
    // Check if today is Feb 28 on a non-leap year → also show Feb 29 BD holders
    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const currentYear = new Date(nowUTC).getUTCFullYear();
    const isFeb28NonLeap = istMonth === 2 && istDay === 28 && !isLeapYear(currentYear);

    const birthdayQuery = isFeb28NonLeap
      ? {
          $expr: {
            $and: [
              { $eq: [{ $month: "$dob" }, 2] },
              { $in: [{ $dayOfMonth: "$dob" }, [28, 29]] },
            ],
          },
        }
      : {
          $expr: {
            $and: [
              { $eq: [{ $month: "$dob" }, birthdayMonth] },
              { $eq: [{ $dayOfMonth: "$dob" }, birthdayDay] },
            ],
          },
        };

    const todayBirthdays = await Client.find({
      ...agentFilter,
      isActive: true,
      dob: { $exists: true },
      ...birthdayQuery,
    })
      .select("fullName phone email dob")
      .limit(10)
      .lean();

    // ── 5. Upcoming maturities (90 days) ─────────────────────────────────────
    const upcomingMaturities = await Policy.find({
      ...agentFilter,
      status: "active",
      $or: [
        { maturityDate: { $gte: todayStartUTC, $lte: plus90 } },
      ],
    })
      .populate("clientId", "fullName phone")
      .populate("insurerId", "name")
      .sort({ maturityDate: 1 })
      .limit(5)
      .lean();

    // ── 6. Scheduled lead follow-ups today ────────────────────────────────────
    const scheduledLeadFollowups = await Lead.find({
      ...agentFilter,
      status: { $nin: ["converted", "lost"] },
      followUpDate: { $gte: todayStartUTC, $lte: todayEndUTC },
    })
      .populate("clientId", "fullName phone")
      .sort({ followUpDate: 1 })
      .limit(10)
      .lean();

    // ── 7. Missed follow-ups — overdue leads (followUpDate < today, not done) ─
    const missedFollowups = await Lead.find({
      ...agentFilter,
      status: { $nin: ["converted", "lost"] },
      followUpDate: { $lt: todayStartUTC },
    })
      .populate("clientId", "fullName phone")
      .sort({ followUpDate: 1 })
      .limit(10)
      .lean();

    const responseData = {
      renewalsThisWeek: renewalsThisWeek.map((p: any) => ({
        id: p._id,
        clientName: (p.clientId as any)?.fullName,
        clientPhone: (p.clientId as any)?.phone,
        clientId: (p.clientId as any)?._id,
        policyNumber: p.policyNumber,
        policyId: p._id,
        insurer: (p.insurerId as any)?.name,
        policyType: p.type,
        endDate: p.expiryDate ?? p.maturityDate,
        type: "renewal" as const,
      })),
      dueTodayPremiums: dueTodayPremiums.map((p: any) => ({
        id: p._id,
        clientName: (p.clientId as any)?.fullName,
        clientPhone: (p.clientId as any)?.phone,
        clientId: (p.clientId as any)?._id,
        policyNumber: (p.policyId as any)?.policyNumber,
        policyId: (p.policyId as any)?._id,
        insurer: (p.policyId as any)?.insurerId?.name,
        amount: p.balanceAmount,
        dueDate: p.dueDate,
        type: "overdue" as const,
      })),
      overduePremiums,
      todayBirthdays: todayBirthdays.map((c: any) => ({
        id: c._id,
        clientName: c.fullName,
        clientPhone: c.phone,
        clientId: c._id,
        dob: c.dob,
        email: c.email,
        type: "birthday" as const,
      })),
      upcomingMaturities: upcomingMaturities.map((p: any) => ({
        id: p._id,
        clientName: (p.clientId as any)?.fullName,
        clientPhone: (p.clientId as any)?.phone,
        clientId: (p.clientId as any)?._id,
        policyNumber: p.policyNumber,
        policyId: p._id,
        insurer: (p.insurerId as any)?.name,
        maturityDate: p.maturityDate,
        sumAssured: p.sumAssured,
        type: "maturity" as const,
      })),
      scheduledLeadFollowups,
      missedFollowups,
    };

    setCache(cacheKey, responseData);
    return NextResponse.json({ success: true, data: responseData });
  } catch (err) {
    console.error("[DASHBOARD_ACTIONS]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch actions" }, { status: 500 });
  }
}
