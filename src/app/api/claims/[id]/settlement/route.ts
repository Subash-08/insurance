import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Claim from "@/models/Claim";
import Policy from "@/models/Policy";
import AuditLog from "@/models/AuditLog";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();
    const {
      settlementAmount,
      tdsDeducted = 0,
      settlementDate,
      paymentMode,
      bankAccount,
      ifscCode,
      accountHolderName,
      settlementLetterUrl,
      notes,
    } = body;

    const claim: any = await Claim.findById(params.id).populate("policyId");
    if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });

    if (session.user.role !== "owner" && claim.agentId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (claim.status !== "approved") {
      return NextResponse.json({ success: false, error: "Claim must be in 'approved' status to record settlement" }, { status: 400 });
    }

    const policy: any = claim.policyId;

    // Sanity check: settlement should not exceed 120% of sum assured
    if (policy?.sumAssured && settlementAmount > policy.sumAssured * 1.2) {
      return NextResponse.json({
        success: false,
        error: `Settlement amount (₹${settlementAmount / 100}) exceeds 120% of policy sum assured sanity check.`,
      }, { status: 400 });
    }

    const netPayout = settlementAmount - tdsDeducted;
    const isPartial = settlementAmount < claim.estimatedAmount;

    const settlement = {
      settlementAmount,
      tdsDeducted,
      netPayout,
      isPartial,
      settlementDate: new Date(settlementDate),
      paymentMode,
      bankAccount,
      ifscCode,
      accountHolderName,
      settlementLetterUrl,
      settledBy: session.user.id,
      notes,
    };

    // Atomic: set settlement + push settlement_received to statusHistory
    await Claim.findByIdAndUpdate(params.id, {
      $set: {
        settlement,
        status: "settlement_received",
        ...(isPartial ? {} : {}), // partial: agent must manually close
      },
      $push: {
        statusHistory: {
          status: "settlement_received",
          changedBy: session.user.id,
          changedAt: new Date(),
          notes: isPartial
            ? `Partial settlement recorded. Amount: ₹${settlementAmount / 100} vs estimated ₹${claim.estimatedAmount / 100}`
            : `Settlement received: ₹${settlementAmount / 100}`,
        },
      },
    });

    // Maturity claim: auto-update policy status if applicable
    if (claim.claimType === "maturity" && policy?.status === "active") {
      await Policy.findByIdAndUpdate(claim.policyId._id || claim.policyId, { $set: { status: "matured" } });
    }

    await AuditLog.create({
      userId: session.user.id,
      action: "Updated",
      module: "Claim",
      details: `Settlement recorded for claim ${claim.claimNumber}. Amount: ₹${settlementAmount / 100}. Partial: ${isPartial}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, settlement, isPartial });
  } catch (err: any) {
    console.error("[CLAIM_SETTLEMENT]", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
