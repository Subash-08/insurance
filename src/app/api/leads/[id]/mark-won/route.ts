import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Client from "@/models/Client";
import Notification from "@/models/Notification";
import { checkOwnership } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();
  const { id } = ctx.params;

  if (req.method === "PATCH") {
    const body = await req.json();
    if (!body.clientId) throw new Error("clientId is required to mark a lead as won");

    const lead = await Lead.findOne({ _id: id, isActive: true });
    if (!lead) throw new Error("Lead not found");
    if (!checkOwnership(lead, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (lead.stage === "won") {
      return NextResponse.json({ success: false, message: "Lead already converted" }, { status: 400 });
    }

    // Verify the clientId belongs to the agency
    const client = await Client.findOne({ _id: body.clientId, isActive: true, agencyId: session.user.agencyId }).lean() as any;
    if (!client) {
      return NextResponse.json({ success: false, message: "Invalid or unauthorized Client ID" }, { status: 400 });
    }

    lead.stage = "won";
    lead.wonClientId = body.clientId;
    lead.convertedAt = new Date();
    lead.updatedAt = new Date();
    await lead.save();

    // Create Notification if it's an employee converting it, to notify the owner
    // Or if we just want a standard audit
    if (session.user.role === "employee") {
      await Notification.create({
        userId: session.user.agencyId, // Notify the owner
        agencyId: session.user.agencyId,
        type: "lead_converted",
        title: "Lead Converted",
        message: `${session.user.name} converted lead ${lead.fullName} to a client.`,
        entityType: "Client",
        entityId: client._id,
        entityUrl: `/clients/${client._id}`,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, data: lead });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const PATCH = withApiHandler(handler, true);
