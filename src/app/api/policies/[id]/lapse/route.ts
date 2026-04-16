import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Policy from "@/models/Policy";
import Premium from "@/models/Premium";
import { logAudit, isPolicyTransitionValid } from "@/lib/insurance";
import mongoose from "mongoose";

type Params = { params: { id: string } };

// ─── POST /api/policies/[id]/lapse ───────────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const { lapseReason } = body;

  if (!lapseReason?.trim()) {
    return NextResponse.json(
      { success: false, message: "Lapse reason is required", field: "lapseReason" },
      { status: 400 }
    );
  }

  await dbConnect();
  const policy = await Policy.findOne({ _id: params.id, isActive: true });
  if (!policy) {
    return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });
  }

  // Ownership check
  if (user.role === "employee" && policy.agentId.toString() !== user.id) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  // State machine check
  if (!isPolicyTransitionValid(policy.status, "lapsed")) {
    return NextResponse.json(
      { success: false, message: `Cannot lapse a ${policy.status} policy` },
      { status: 400 }
    );
  }

  policy.status = "lapsed";
  policy.lapseReason = lapseReason.trim();
  await policy.save();

  // Cancel all future premiums
  const cancelled = await Premium.updateMany(
    { policyId: policy._id, status: { $in: ["upcoming", "due"] } },
    { status: "cancelled" }
  );

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "STATUS_CHANGE",
    entity: "Policy",
    entityId: policy._id.toString(),
    changes: { before: { status: "active" }, after: { status: "lapsed" } },
    details: `Lapsed policy ${policy.policyNumber}. Reason: ${lapseReason}. ${cancelled.modifiedCount} premiums cancelled.`,
  });

  return NextResponse.json({
    success: true,
    message: `Policy lapsed. ${cancelled.modifiedCount} future premiums cancelled.`,
  });
}
