import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Policy from "@/models/Policy";
import Premium from "@/models/Premium";
import { logAudit, generatePremiumSchedule, isPolicyTransitionValid } from "@/lib/insurance";
import mongoose from "mongoose";
import { addDays } from "date-fns";

type Params = { params: { id: string } };

// ─── POST /api/policies/[id]/renew ───────────────────────────────────────────
// Creates a new policy document as a renewal of the existing one
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  await dbConnect();
  const oldPolicy = await Policy.findOne({ _id: params.id, isActive: true });
  if (!oldPolicy) {
    return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });
  }

  if (user.role === "employee" && oldPolicy.agentId.toString() !== user.id) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  // Cannot renew lapsed or terminal policies
  if (!["active"].includes(oldPolicy.status)) {
    const msg =
      oldPolicy.status === "lapsed"
        ? "Lapsed policies cannot be renewed. File a revival request instead."
        : `${oldPolicy.status} policies cannot be renewed.`;
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }

  const body = await req.json();
  const { newPolicyNumber, newMaturityDate, newExpiryDate } = body;

  if (!newPolicyNumber) {
    return NextResponse.json({ success: false, message: "New policy number is required", field: "newPolicyNumber" }, { status: 400 });
  }

  // New start date = old expiryDate or maturityDate + 1 day
  const oldEndDate = oldPolicy.expiryDate || oldPolicy.maturityDate;
  if (!oldEndDate) {
    return NextResponse.json({ success: false, message: "Cannot determine renewal start date — original policy has no end date" }, { status: 400 });
  }
  const newStartDate = addDays(oldEndDate, 1);
  const newEndDate = newMaturityDate
    ? new Date(newMaturityDate)
    : newExpiryDate
    ? new Date(newExpiryDate)
    : null;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  let newPolicy: any;
  let premiumCount = 0;

  try {
    // Mark old policy as matured
    oldPolicy.status = "matured";
    await oldPolicy.save({ session: mongoSession });

    // Create new policy as renewal
    [newPolicy] = await Policy.create(
      [
        {
          agentId: oldPolicy.agentId,
          agencyId: oldPolicy.agencyId,
          clientId: oldPolicy.clientId,
          insurerId: oldPolicy.insurerId,
          policyNumber: newPolicyNumber.trim(),
          planName: oldPolicy.planName,          // snapshot carried forward
          type: oldPolicy.type,
          startDate: newStartDate,
          maturityDate: newMaturityDate ? new Date(newMaturityDate) : undefined,
          expiryDate: newExpiryDate ? new Date(newExpiryDate) : undefined,
          sumAssured: oldPolicy.sumAssured,
          premiumAmount: oldPolicy.premiumAmount,
          gstAmount: oldPolicy.gstAmount,
          totalPremium: oldPolicy.totalPremium,
          paymentFrequency: oldPolicy.paymentFrequency,
          gracePeriodDays: oldPolicy.gracePeriodDays,
          status: "active",
          renewedFromId: oldPolicy._id,
          lifeDetails: oldPolicy.lifeDetails,
          healthDetails: oldPolicy.healthDetails,
          vehicleDetails: oldPolicy.vehicleDetails,
          ulipDetails: oldPolicy.ulipDetails,
        },
      ],
      { session: mongoSession }
    );

    // Generate new premium schedule
    if (newEndDate) {
      const schedule = generatePremiumSchedule(
        newStartDate,
        newEndDate,
        oldPolicy.paymentFrequency,
        oldPolicy.totalPremium,
        oldPolicy.gracePeriodDays
      );
      premiumCount = schedule.length;

      if (schedule.length > 0) {
        const premiumDocs = schedule.map((s) => ({
          policyId: newPolicy._id,
          clientId: newPolicy.clientId,
          agentId: newPolicy.agentId,
          agencyId: newPolicy.agencyId,
          dueDate: s.dueDate,
          amount: s.amount,
          gracePeriodDays: s.gracePeriodDays,
          status: s.status,
        }));

        await Premium.insertMany(premiumDocs, { session: mongoSession });

        const firstDue = schedule[0]?.dueDate;
        if (firstDue) {
          await Policy.findByIdAndUpdate(newPolicy._id, { nextPremiumDue: firstDue }, { session: mongoSession });
        }
      }
    }

    await mongoSession.commitTransaction();
  } catch (err: any) {
    await mongoSession.abortTransaction();
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, message: "A policy with this number already exists", field: "newPolicyNumber" },
        { status: 409 }
      );
    }
    console.error("[POST /api/policies/renew]", err);
    return NextResponse.json({ success: false, message: "Failed to renew policy" }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "CREATE",
    entity: "Policy",
    entityId: newPolicy._id.toString(),
    details: `Renewed policy ${oldPolicy.policyNumber} → new policy ${newPolicyNumber}. ${premiumCount} premiums generated.`,
  });

  return NextResponse.json({
    success: true,
    data: { newPolicyId: newPolicy._id },
    message: `Policy renewed. ${premiumCount} premium records generated.`,
  });
}
