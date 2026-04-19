import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { checkOwnership } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();
  const { id } = ctx.params;

  if (req.method === "POST") {
    const lead = await Lead.findOne({ _id: id, isActive: true });
    if (!lead) throw new Error("Lead not found");
    if (!checkOwnership(lead, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.text) throw new Error("Note text is required");

    lead.followUpNotes.push({
      text: body.text,
      addedBy: session.user.id,
      addedAt: new Date(),
      nextFollowUpDate: body.nextFollowUpDate,
      contactMethod: body.contactMethod,
    });

    if (body.nextFollowUpDate) {
      lead.nextFollowUpDate = body.nextFollowUpDate;
    }
    lead.lastContactedAt = new Date();

    await lead.save();

    return NextResponse.json({ success: true, data: lead });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const POST = withApiHandler(handler, true);
