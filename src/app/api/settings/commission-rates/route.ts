import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Insurer from "@/models/Insurer";
import AuditLog from "@/models/AuditLog";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();

  if (req.method === "POST") {
    // Only agency owners can configure structural commission rates
    if (session.user.role !== "owner") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { insurerId, commissionRates } = body;

    if (!insurerId || !commissionRates) {
      return NextResponse.json({ success: false, message: "Missing insurerId or commissionRates object" }, { status: 400 });
    }

    // Convert raw object into Map format expected by Mongoose Maps
    const updatedInsurer = await Insurer.findOneAndUpdate(
      { _id: insurerId },
      { $set: { commissionRates } },
      { new: true }
    );

    if (!updatedInsurer) {
      return NextResponse.json({ success: false, message: "Insurer not found" }, { status: 404 });
    }

    await AuditLog.create({
      userId: session.user.id,
      userRole: session.user.role,
      action: "UPDATE",
      entity: "Insurer",
      entityId: insurerId,
      details: `Updated commission rate boundaries configuration.`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, data: updatedInsurer });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const POST = withApiHandler(handler, true);
