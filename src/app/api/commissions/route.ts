import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import CommissionLog from "@/models/CommissionLog";
import { buildDataFilter } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();

  if (req.method === "GET") {
    const filter = buildDataFilter(session);
    const { searchParams } = new URL(req.url);
    
    if (searchParams.has("status")) {
      filter.status = searchParams.get("status");
    }
    if (searchParams.has("month")) {
      filter.month = searchParams.get("month");
    }

    const commissions = await CommissionLog.find(filter)
      .populate("policyId", "policyNumber planName")
      .populate("clientId", "fullName")
      .populate("agentId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: commissions });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const GET = withApiHandler(handler, true);
