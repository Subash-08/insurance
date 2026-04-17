import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Premium from "@/models/Premium";
import Policy from "@/models/Policy";
import AuditLog from "@/models/AuditLog";
import { createCommissionLogEntry } from "@/lib/commission";
import { z } from "zod";
import mongoose from "mongoose";

const payPremiumSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().datetime(), // ISO string from frontend
  mode: z.enum(["cash", "cheque", "upi", "neft", "rtgs", "online", "ecs", "nach"]),
  receiptNumber: z.string().optional(),
  utrNumber: z.string().optional(),
  bankName: z.string().optional(),
  chequeNumber: z.string().optional(),
  receiptPhoto: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  ecsEnrolled: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const parsed = payPremiumSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // RETRY STRATEGY FOR OCC conflicts (Max 3 attempts)
    const MAX_RETRIES = 3;
    let attempt = 0;
    let savedPremium = null;
    let paymentHistoryId = null;
    let calculatedNextDueDate = null;

    while (attempt < MAX_RETRIES) {
      const premium = await Premium.findById(params.id);
      if (!premium) {
        return NextResponse.json({ success: false, error: "Premium not found" }, { status: 404 });
      }

      // Check agent isolation rules
      if (session.user.role !== "owner" && premium.agentId.toString() !== session.user.id) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      // Idempotency Check
      if (premium.usedIdempotencyKeys?.includes(data.idempotencyKey)) {
        return NextResponse.json({ success: true, message: "Payment already recorded (idempotent)" });
      }

      // Concurrency OCC variables
      const currentVersion = premium.__v;

      // Construct history entry
      const newPaymentId = new mongoose.Types.ObjectId();
      const newPayment = {
        _id: newPaymentId,
        amount: data.amount,
        date: new Date(data.date),
        mode: data.mode,
        receiptNumber: data.receiptNumber || `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        utrNumber: data.utrNumber,
        bankName: data.bankName,
        chequeNumber: data.chequeNumber,
        isBounced: false,
        idempotencyKey: data.idempotencyKey,
        notes: data.notes,
        receiptPhoto: data.receiptPhoto,
        recordedBy: new mongoose.Types.ObjectId(session.user.id)
      };

      // We explicitly pull the current array and push to evaluate in memory
      premium.paymentHistory.push(newPayment);
      premium.usedIdempotencyKeys.push(data.idempotencyKey);

      // Mutates paidAmount, balanceAmount, status correctly
      premium.recalculateState();

      // Overpayment Check
      if (premium.paidAmount > premium.amount) {
        return NextResponse.json(
          { success: false, error: "Overpayment detected. Payment exceeds due amount." },
          { status: 400 }
        );
      }

      // Attempt Save via OCC
      const updateResult = await Premium.findOneAndUpdate(
        { _id: premium._id, __v: currentVersion },
        {
          $push: {
            paymentHistory: newPayment,
            usedIdempotencyKeys: data.idempotencyKey
          },
          $set: {
            paidAmount: premium.paidAmount,
            balanceAmount: premium.balanceAmount,
            status: premium.status,
          },
          $inc: { __v: 1 }
        },
        { new: true }
      );

      if (updateResult) {
        savedPremium = updateResult;
        paymentHistoryId = newPaymentId;
        break; // Success, exit retry loop
      } else {
        // Conflict!
        attempt++;
        if (attempt >= MAX_RETRIES) {
          return NextResponse.json(
            { success: false, error: "Concurrent modifications prevented saving. Please try again." },
            { status: 409 }
          );
        }
      }
    }

    if (!savedPremium) {
      return NextResponse.json({ success: false, error: "Payment failed to resolve." }, { status: 500 });
    }

    // Update Policy ECS if requested
    const policy = await Policy.findById(savedPremium.policyId);
    if (policy && data.ecsEnrolled) {
      policy.ecsEnrolled = true;
      if (data.bankName) policy.ecsBank = data.bankName;
      await policy.save();
    }

    if (policy) {
      // Commission logic triggered for this specific transaction
      await createCommissionLogEntry({
        premiumId: savedPremium._id,
        paymentHistoryId: paymentHistoryId as mongoose.Types.ObjectId,
        policyId: savedPremium.policyId,
        clientId: savedPremium.clientId,
        agentId: savedPremium.agentId,
        insurerId: policy.insurerId,
        policyType: policy.type,
        paidAmount: data.amount, // Commission generated solely off THIS delta
        paymentDate: new Date(data.date)
      }).catch(err => console.error("Commission log failed:", err)); // Non-blocking

      // Check if next Due Date should update
      if (savedPremium.status === "paid") {
        // Find the earliest upcoming unpaid premium
        const nextPremium = await Premium.findOne({
          policyId: savedPremium.policyId,
          status: { $in: ["upcoming", "due", "overdue", "partially_paid", "ecs_pending"] },
          _id: { $ne: savedPremium._id }
        }).sort({ dueDate: 1 });

        if (nextPremium) {
          policy.nextPremiumDue = nextPremium.dueDate;
          calculatedNextDueDate = nextPremium.dueDate;
        } else {
          policy.nextPremiumDue = undefined;
        }
        await policy.save();
      }
    }

    // Audit Log
    await AuditLog.create({
      userId: session.user.id,
      action: "Updated",
      module: "Premium",
      details: `Recorded payment of ₹${data.amount / 100} for premium ${savedPremium._id}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({
      success: true,
      premium: savedPremium,
      nextDueDate: calculatedNextDueDate
    });

  } catch (error: any) {
    console.error("[PREMIUM_PAY_PATCH]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
