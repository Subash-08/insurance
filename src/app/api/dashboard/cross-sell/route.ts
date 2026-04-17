import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import Policy from "@/models/Policy";

// Owner-only endpoint
const CACHE_TTL = 10 * 60 * 1000; // 10 min (cross-sell is expensive)
const cache = new Map<string, { data: unknown; cachedAt: number }>();
function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.cachedAt < CACHE_TTL) return entry.data;
  return null;
}
function setCache(key: string, data: unknown) {
  if (cache.size > 50) cache.clear();
  cache.set(key, { data, cachedAt: Date.now() });
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (token.status !== "active") return NextResponse.json({ success: false, error: "Account not active" }, { status: 403 });

  // STRICT: Owner only
  if (token.role !== "owner") {
    return NextResponse.json({ success: false, error: "Owner access required" }, { status: 403 });
  }

  const userId = token.id as string;
  const refresh = req.nextUrl.searchParams.get("refresh") === "true";
  const cacheKey = `${userId}_owner_cross_sell`;

  if (!refresh) {
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached, fromCache: true });
  }

  await dbConnect();

  try {
    // CRITICAL FIX: Use pipeline projection in $lookup to avoid pulling full documents
    // Common lookup function with minimal projection
    const policyLookupPipeline = [
      { $project: { type: { $toLower: "$type" }, clientId: 1, status: 1 } },
    ];

    // ── lifeNotHealth: has life/term but NO health policy ─────────────────────
    const lifeNotHealth = await Client.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "policies",
          localField: "_id",
          foreignField: "clientId",
          pipeline: policyLookupPipeline,
          as: "policies",
        },
      },
      {
        $match: {
          $and: [
            { "policies.type": { $in: ["life", "term"] } },
            { "policies.type": { $nin: ["health"] } }
          ]
        },
      },
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
          fullName: 1,
          phone: 1,
          agentName: { $arrayElemAt: ["$agent.name", 0] },
          agentId: 1,
          policyTypes: "$policies.type",
        },
      },
      { $limit: 10 },
    ]);

    // ── vehicleNotLife: has vehicle but NO life/term ───────────────────────────
    const vehicleNotLife = await Client.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "policies",
          localField: "_id",
          foreignField: "clientId",
          pipeline: policyLookupPipeline,
          as: "policies",
        },
      },
      {
        $match: {
          $and: [
            { "policies.type": "vehicle" },
            { "policies.type": { $nin: ["life", "term"] } }
          ]
        },
      },
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
          fullName: 1,
          phone: 1,
          agentName: { $arrayElemAt: ["$agent.name", 0] },
          agentId: 1,
          policyTypes: "$policies.type",
        },
      },
      { $limit: 10 },
    ]);

    // ── healthNotLife: has health but NO life/term ────────────────────────────
    const healthNotLife = await Client.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "policies",
          localField: "_id",
          foreignField: "clientId",
          pipeline: policyLookupPipeline,
          as: "policies",
        },
      },
      {
        $match: {
          $and: [
            { "policies.type": "health" },
            { "policies.type": { $nin: ["life", "term"] } }
          ]
        },
      },
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
          fullName: 1,
          phone: 1,
          agentName: { $arrayElemAt: ["$agent.name", 0] },
          agentId: 1,
          policyTypes: "$policies.type",
        },
      },
      { $limit: 10 },
    ]);

    // ── noInsurance: clients with ZERO active policies ─────────────────────────
    const noInsurance = await Client.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "policies",
          localField: "_id",
          foreignField: "clientId",
          pipeline: [
            { $match: { status: "active" } },
            { $project: { _id: 1 } },
          ],
          as: "activePolicies",
        },
      },
      { $match: { activePolicies: { $size: 0 } } },
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
          fullName: 1,
          phone: 1,
          agentName: { $arrayElemAt: ["$agent.name", 0] },
          agentId: 1,
          policyTypes: [],
        },
      },
      { $limit: 10 },
    ]);

    const totalOpportunities =
      lifeNotHealth.length + vehicleNotLife.length + healthNotLife.length + noInsurance.length;

    const responseData = {
      lifeNotHealth,
      vehicleNotLife,
      healthNotLife,
      noInsurance,
      totalOpportunities,
    };

    setCache(cacheKey, responseData);
    return NextResponse.json({ success: true, data: responseData });
  } catch (err) {
    console.error("[DASHBOARD_CROSS_SELL]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch cross-sell data" }, { status: 500 });
  }
}
