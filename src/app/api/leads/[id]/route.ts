import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { checkOwnership } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();
  const { id } = ctx.params;

  if (req.method === "GET") {
    const lead = await Lead.findOne({ _id: id, isActive: true }).lean() as any;
    if (!lead) throw new Error("Lead not found");
    if (!checkOwnership(lead, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: lead });
  }

  if (req.method === "PUT") {
    const body = await req.json();

    // HARD BLOCK ON WON STAGE - MUST USE /convert OR /mark-won
    if (body.stage === "won") {
      return NextResponse.json(
        { success: false, message: "Cannot directly update stage to 'won'. Use the convert to client flow." },
        { status: 400 }
      );
    }

    const lead = await Lead.findOne({ _id: id, isActive: true });
    if (!lead) throw new Error("Lead not found");
    if (!checkOwnership(lead, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (body.phone) {
        body.phone = body.phone.replace(/\D/g, "");
    }

    Object.assign(lead, body);
    lead.updatedAt = new Date();
    await lead.save();

    return NextResponse.json({ success: true, data: lead });
  }

  if (req.method === "DELETE") {
    // Only owner can delete (soft delete)
    if (session.user.role !== "owner") {
      return NextResponse.json({ success: false, message: "Only owners can delete leads" }, { status: 403 });
    }

    const lead = await Lead.findOne({ _id: id, isActive: true });
    if (!lead) throw new Error("Lead not found");

    if (lead.stage === "won") {
      return NextResponse.json(
        { success: false, message: "Cannot delete a converted lead" },
        { status: 400 }
      );
    }

    lead.isActive = false;
    lead.deletedAt = new Date();
    await lead.save();

    return NextResponse.json({ success: true, message: "Lead deleted" });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const GET = withApiHandler(handler, true);
export const PUT = withApiHandler(handler, true);
export const DELETE = withApiHandler(handler, true);
