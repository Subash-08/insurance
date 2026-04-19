import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Claim from "@/models/Claim";
import AuditLog from "@/models/AuditLog";
import { validateStatusTransition, ClaimStatus } from "@/lib/claims-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const { newStatus, notes } = await req.json();

    const claim: any = await Claim.findById(params.id);
    if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });

    // Ownership check
    if (session.user.role !== "owner" && claim.agentId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Validate transition
    if (!validateStatusTransition(claim.status as ClaimStatus, newStatus as ClaimStatus)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status transition from '${claim.status}' to '${newStatus}'`,
      }, { status: 400 });
    }

    // ── Atomic update: status + statusHistory in ONE operation ────────────────
    const updated: any = await Claim.findByIdAndUpdate(
      params.id,
      {
        $set: { status: newStatus },
        $push: {
          statusHistory: {
            status: newStatus,
            changedBy: session.user.id,
            changedAt: new Date(),
            notes: notes || "",
          },
        },
      },
      { new: true }
    );

    await AuditLog.create({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Claim",
      details: `Status changed from '${claim.status}' to '${newStatus}' on claim ${claim.claimNumber}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, claim: updated });
  } catch (err: any) {
    console.error("[CLAIM_STATUS]", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
