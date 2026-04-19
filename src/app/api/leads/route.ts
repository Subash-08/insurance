import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { buildDataFilter } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();

  if (req.method === "GET") {
    const filter = buildDataFilter(session);
    
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    if (stage) filter.stage = stage;
    
    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    // Compute `isStale` client-side or we can inject it based on lastContactedAt and priority
    // A lead is "stale" if not contacted in >3 days (or similar logic)
    const now = Date.now();
    const enriched = leads.map(l => {
      const isStale = l.lastContactedAt ? (now - new Date(l.lastContactedAt).getTime()) > 3 * 24 * 60 * 60 * 1000 : false;
      return { ...l, isStale };
    });

    return NextResponse.json({ success: true, data: enriched });
  }

  if (req.method === "POST") {
    const body = await req.json();

    // Normalizing phone
    if (!body.phone) throw new Error("Phone is required");
    const normalizedPhone = body.phone.replace(/\D/g, "");

    // Resolve agencyId — owners may not have agencyId populated in JWT,
    // in which case their own user ID doubles as the agency root.
    const agencyId = session.user.agencyId || session.user.id;

    const existing = await Lead.findOne({
      phone: normalizedPhone,
      agencyId,
      isActive: true,
    });

    if (existing) {
      if (session.user.role === "owner" && body.overrideConfirmed === true) {
        // let it pass, just warn in the response ideally
      } else {
        return NextResponse.json(
          {
            success: false,
            message: session.user.role === "owner"
              ? "Duplicate Lead found. Pass overrideConfirmed to create anyway."
              : "Duplicate Lead phone found in agency. Access denied.",
            code: "DUPLICATE_PHONE",
            existingAgentId: existing.agentId,
          },
          { status: 409 }
        );
      }
    }

    // Map frontend field names → schema field names
    const { productInterest, estimatedPremium, ...rest } = body;

    const newLead = await Lead.create({
      ...rest,
      phone: normalizedPhone,
      agentId: session.user.id,
      agencyId,
      interestedIn: productInterest ? [productInterest] : [],
      estimatedBudget: estimatedPremium ?? undefined,
      lastContactedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: newLead }, { status: 201 });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const GET = withApiHandler(handler, true);
export const POST = withApiHandler(handler, true);
