import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Insurer from "@/models/Insurer";
import { logAudit } from "@/lib/insurance";
import mongoose from "mongoose";

type Params = { params: { id: string } };

// ─── POST /api/insurers/[id]/plans ───────────────────────────────────────────
// Add a new plan to an insurer
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  if (user.role !== "owner") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid insurer ID" }, { status: 400 });
  }

  const body = await req.json();
  const { planName, planCode } = body;

  if (!planName?.trim()) {
    return NextResponse.json(
      { success: false, message: "Plan name is required", field: "planName" },
      { status: 400 }
    );
  }

  await dbConnect();
  const insurer = await Insurer.findById(params.id);
  if (!insurer || !insurer.isActive) {
    return NextResponse.json({ success: false, message: "Insurer not found" }, { status: 404 });
  }

  // Validate plan name is unique within this insurer (case-insensitive)
  const duplicate = insurer.plans.find(
    (p: { planName: string; isActive: boolean }) =>
      p.planName.toLowerCase() === planName.trim().toLowerCase() && p.isActive
  );
  if (duplicate) {
    return NextResponse.json(
      { success: false, message: "A plan with this name already exists for this insurer", field: "planName" },
      { status: 409 }
    );
  }

  insurer.plans.push({ planName: planName.trim(), planCode: planCode?.trim(), isActive: true } as any);
  await insurer.save();

  const newPlan = insurer.plans[insurer.plans.length - 1];

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "CREATE",
    entity: "Insurer",
    entityId: insurer._id.toString(),
    details: `Added plan "${planName}" to insurer ${insurer.name}`,
  });

  return NextResponse.json({ success: true, data: newPlan }, { status: 201 });
}
