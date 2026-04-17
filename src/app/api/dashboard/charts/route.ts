import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/mongodb";
import Premium from "@/models/Premium";
import Policy from "@/models/Policy";
import Client from "@/models/Client";
import mongoose from "mongoose";

// ── Cache ──────────────────────────────────────────────────────────────────────
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

// ── IST helpers ────────────────────────────────────────────────────────────────
function get12MonthsBounds() {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const nowUTC = Date.now();
  const nowIST = new Date(nowUTC + IST_OFFSET);

  // 12 months ago, start of that month
  const start = new Date(nowIST);
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - 11);
  const startUTC = new Date(start.getTime() - IST_OFFSET);

  return { startUTC, nowUTC: new Date(nowUTC) };
}

function monthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (token.status !== "active") return NextResponse.json({ success: false, error: "Account not active" }, { status: 403 });

  const userId = token.id as string;
  const role = token.role as string;
  const type = req.nextUrl.searchParams.get("type") ?? "monthly_premium";
  const refresh = req.nextUrl.searchParams.get("refresh") === "true";

  const cacheKey = `${userId}_${role}_charts_${type}`;
  if (!refresh) {
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached, fromCache: true });
  }

  await dbConnect();
  const agentFilter = role === "owner" ? {} : { agentId: new mongoose.Types.ObjectId(userId) };
  const { startUTC, nowUTC } = get12MonthsBounds();

  try {
    let data: unknown;

    if (type === "monthly_premium") {
      // CRITICAL FIX: unwind paymentHistory for time-accurate monthly chart
      // Never use paidAmount — that's cumulative, not time-bounded
      const raw = await Premium.aggregate([
        { $match: agentFilter },
        { $unwind: "$paymentHistory" },
        {
          $match: {
            "paymentHistory.isBounced": false,
            "paymentHistory.date": { $gte: startUTC, $lte: nowUTC },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: { date: "$paymentHistory.date", timezone: "Asia/Kolkata" } },
              month: { $month: { date: "$paymentHistory.date", timezone: "Asia/Kolkata" } },
            },
            total: { $sum: "$paymentHistory.amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      data = raw.map((r) => ({
        month: monthLabel(r._id.year, r._id.month),
        total: r.total, // in paise
        count: r.count,
      }));
    } else if (type === "policy_types") {
      // CRITICAL FIX: normalize policy type to lowercase to avoid "Life"/"life" mismatch
      const raw = await Policy.aggregate([
        { $match: { ...agentFilter, status: "active" } },
        {
          $group: {
            _id: { $toLower: "$type" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const labelMap: Record<string, string> = {
        life: "Life",
        health: "Health",
        vehicle: "Vehicle",
        ulip: "ULIP",
        fire: "Fire",
        travel: "Travel",
        group: "Group",
        term: "Term",
      };

      data = raw.map((r) => ({
        type: labelMap[r._id] ?? r._id,
        count: r.count,
      }));
    } else if (type === "new_clients") {
      const raw = await Client.aggregate([
        { $match: { ...agentFilter, createdAt: { $gte: startUTC, $lte: nowUTC } } },
        {
          $group: {
            _id: {
              year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
              month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      data = raw.map((r) => ({
        month: monthLabel(r._id.year, r._id.month),
        count: r.count,
      }));
    } else {
      return NextResponse.json({ success: false, error: "Invalid chart type" }, { status: 400 });
    }

    setCache(cacheKey, data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[DASHBOARD_CHARTS]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch chart data" }, { status: 500 });
  }
}
