import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Insurer from "@/models/Insurer";
import Policy from "@/models/Policy";
import { logAudit } from "@/lib/insurance";
import mongoose from "mongoose";

type Params = { params: { id: string; planId: string } };

// ─── PUT /api/insurers/[id]/plans/[planId] ────────────────────────────────────
export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  if (user.role !== "owner") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  await dbConnect();
  const insurer = await Insurer.findById(params.id);
  if (!insurer) {
    return NextResponse.json({ success: false, message: "Insurer not found" }, { status: 404 });
  }

  const plan = insurer.plans.id(params.planId);
  if (!plan) {
    return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
  }

  const body = await req.json();
  if (body.planName) plan.planName = body.planName.trim();
  if (body.planCode !== undefined) plan.planCode = body.planCode?.trim();

  await insurer.save();

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "UPDATE",
    entity: "Insurer",
    entityId: insurer._id.toString(),
    details: `Updated plan "${plan.planName}" for insurer ${insurer.name}`,
  });

  return NextResponse.json({ success: true, data: plan });
}

// ─── DELETE /api/insurers/[id]/plans/[planId] ─────────────────────────────────
// Soft deactivate — check active policies first
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  if (user.role !== "owner") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  await dbConnect();
  const insurer = await Insurer.findById(params.id);
  if (!insurer) {
    return NextResponse.json({ success: false, message: "Insurer not found" }, { status: 404 });
  }

  const plan = insurer.plans.id(params.planId);
  if (!plan) {
    return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
  }

  // Block if active policies reference this plan by name + insurer
  const activePolicies = await Policy.countDocuments({
    insurerId: params.id,
    planName: plan.planName,
    status: "active",
    isActive: true,
  });

  if (activePolicies > 0) {
    return NextResponse.json(
      {
        success: false,
        message: `Cannot deactivate plan — ${activePolicies} active ${activePolicies === 1 ? "policy uses" : "policies use"} it`,
      },
      { status: 400 }
    );
  }

  plan.isActive = false;
  await insurer.save();

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "DELETE",
    entity: "Insurer",
    entityId: insurer._id.toString(),
    details: `Deactivated plan "${plan.planName}" for insurer ${insurer.name}`,
  });

  return NextResponse.json({ success: true, message: "Plan deactivated" });
}
