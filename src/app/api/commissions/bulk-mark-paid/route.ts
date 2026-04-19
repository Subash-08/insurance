import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import CommissionLog from "@/models/CommissionLog";
import AuditLog from "@/models/AuditLog";
import { buildDataFilter } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();

  if (req.method === "POST") {
    // Only owners or explicitly verified financial admins should do this
    if (session.user.role !== "owner") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { commissionIds, notes } = body;

    if (!Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json({ success: false, message: "No commissions provided" }, { status: 400 });
    }

    const filter = buildDataFilter(session);
    
    // Perform bulk update tightly scoped to the agency
    const result = await CommissionLog.updateMany(
      { _id: { $in: commissionIds }, ...filter, status: "pending" },
      { 
        $set: { status: "paid", notes: notes || "Bulk reconciled" }
      }
    );

    await AuditLog.create({
      userId: session.user.id,
      userRole: session.user.role,
      action: "UPDATE",
      entity: "CommissionLog",
      entityId: "BULK",
      details: `Bulk marked ${result.modifiedCount} commissions as paid`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const POST = withApiHandler(handler, true);
