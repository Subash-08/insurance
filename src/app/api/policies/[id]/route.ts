import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Policy, { POLICY_TRANSITIONS } from "@/models/Policy";
import Premium from "@/models/Premium";
import Claim from "@/models/Claim";
import {
  logAudit,
  isPolicyTransitionValid,
  computeGST,
  generatePremiumSchedule,
} from "@/lib/insurance";
import mongoose from "mongoose";

type Params = { params: { id: string } };

function ownershipCheck(policy: any, userId: string, role: string): boolean {
  if (role === "owner") return true;
  return policy.agentId.toString() === userId;
}

// ─── GET /api/policies/[id] ───────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  await dbConnect();
  const policy = await Policy.findOne({ _id: params.id, isActive: true })
    .populate("clientId")
    .populate("insurerId")
    .populate("agentId", "name email phone")
    .lean() as any;

  if (!policy) {
    return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });
  }
  if (!ownershipCheck(policy, user.id, user.role)) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  // Fetch premiums and claims
  const [premiums, claims] = await Promise.all([
    Premium.find({ policyId: params.id }).sort({ dueDate: 1 }).lean(),
    mongoose.models.Claim
      ? mongoose.models.Claim.find({ policyId: params.id }).sort({ createdAt: -1 }).lean()
      : Promise.resolve([]),
  ]);

  return NextResponse.json({ success: true, data: { ...policy, premiums, claims } });
}

// ─── PUT /api/policies/[id] ───────────────────────────────────────────────────
export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  await dbConnect();
  const policy = await Policy.findOne({ _id: params.id, isActive: true });
  if (!policy) {
    return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });
  }
  if (!ownershipCheck(policy, user.id, user.role)) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  const before = policy.toObject();
  const body = await req.json();

  // Protected fields employees cannot change
  delete body._id;
  delete body.policyNumber;
  delete body.planName;     // snapshot — immutable
  delete body.agencyId;
  delete body.createdAt;
  if (user.role === "employee") {
    delete body.agentId;
    delete body.clientId;
  }

  const premiumChanged =
    body.premiumAmount !== undefined || body.sumAssured !== undefined;
  const newPremiumAmount = body.premiumAmount ?? policy.premiumAmount;
  const newGst = computeGST(newPremiumAmount);
  const newTotal = newPremiumAmount + newGst;

  body.gstAmount = newGst;
  body.totalPremium = newTotal;

  Object.assign(policy, body);
  await policy.save();

  let premiumsUpdated = 0;
  if (premiumChanged) {
    // Update all FUTURE unpaid premiums with new amount
    const updateResult = await Premium.updateMany(
      { policyId: policy._id, status: { $in: ["upcoming", "due"] } },
      { amount: newTotal }
    );
    premiumsUpdated = updateResult.modifiedCount;
  }

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "UPDATE",
    entity: "Policy",
    entityId: policy._id.toString(),
    changes: { before, after: policy.toObject() },
    details: `Updated policy ${policy.policyNumber}${premiumsUpdated ? `, updated ${premiumsUpdated} premium records` : ""}`,
  });

  return NextResponse.json({
    success: true,
    data: policy,
    ...(premiumsUpdated > 0 && { message: `${premiumsUpdated} premium records updated with new amount` }),
  });
}

// ─── DELETE /api/policies/[id] ────────────────────────────────────────────────
// Owner only — soft delete with active claim check
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  if (user.role !== "owner") {
    return NextResponse.json({ success: false, message: "Forbidden — owner only" }, { status: 403 });
  }

  await dbConnect();

  if (mongoose.models.Claim) {
    const activeClaims = await mongoose.models.Claim.countDocuments({
      policyId: params.id,
      status: { $nin: ["settled", "rejected"] },
    });
    if (activeClaims > 0) {
      return NextResponse.json(
        { success: false, message: `Cannot delete — ${activeClaims} active claims reference this policy` },
        { status: 400 }
      );
    }
  }

  const policy = await Policy.findByIdAndUpdate(
    params.id,
    { isActive: false, deletedAt: new Date() },
    { new: true }
  );
  if (!policy) {
    return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });
  }

  // Cancel all future premiums
  await Premium.updateMany(
    { policyId: params.id, status: { $in: ["upcoming", "due"] } },
    { status: "cancelled" }
  );

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "DELETE",
    entity: "Policy",
    entityId: policy._id.toString(),
    details: `Soft-deleted policy ${policy.policyNumber}`,
  });

  return NextResponse.json({ success: true, message: "Policy deleted" });
}
