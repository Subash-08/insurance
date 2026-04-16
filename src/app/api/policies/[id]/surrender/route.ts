import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Policy from "@/models/Policy";
import Premium from "@/models/Premium";
import { logAudit, isPolicyTransitionValid } from "@/lib/insurance";
import mongoose from "mongoose";

type Params = { params: { id: string } };

// ─── POST /api/policies/[id]/surrender ───────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  const body = await req.json();
  const { surrenderValue, surrenderDate, surrenderReason } = body;

  if (!surrenderReason?.trim()) {
    return NextResponse.json(
      { success: false, message: "Surrender reason is required", field: "surrenderReason" },
      { status: 400 }
    );
  }

  await dbConnect();
  const policy = await Policy.findOne({ _id: params.id, isActive: true });
  if (!policy) {
    return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });
  }

  if (user.role === "employee" && policy.agentId.toString() !== user.id) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  if (!isPolicyTransitionValid(policy.status, "surrendered")) {
    return NextResponse.json(
      { success: false, message: `Cannot surrender a ${policy.status} policy` },
      { status: 400 }
    );
  }

  policy.status = "surrendered";
  policy.surrenderValue = surrenderValue;
  policy.surrenderDate = surrenderDate ? new Date(surrenderDate) : new Date();
  policy.surrenderReason = surrenderReason.trim();
  await policy.save();

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
    changes: { before: { status: "active" }, after: { status: "surrendered" } },
    details: `Surrendered policy ${policy.policyNumber}. ${cancelled.modifiedCount} premiums cancelled.`,
  });

  return NextResponse.json({
    success: true,
    message: `Policy surrendered. ${cancelled.modifiedCount} future premiums cancelled.`,
  });
}
