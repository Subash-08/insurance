import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { checkOwnership } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();
  const { id } = ctx.params;

  if (req.method === "POST") {
    const lead = await Lead.findOne({ _id: id, isActive: true }).lean() as any;
    if (!lead) throw new Error("Lead not found");
    if (!checkOwnership(lead, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (lead.stage === "won") {
      return NextResponse.json({ success: false, message: "Lead already converted" }, { status: 400 });
    }

    // Return the prefill data exactly mapping to the frontend Client form
    const prefillData = {
      name: lead.fullName,
      phone: lead.phone,
      email: lead.email || "",
      city: lead.city || "",
      state: lead.state || "",
      leadId: lead._id,
    };

    return NextResponse.json({ success: true, data: prefillData });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const POST = withApiHandler(handler, true);
