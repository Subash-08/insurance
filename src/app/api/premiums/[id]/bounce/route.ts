import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Premium from "@/models/Premium";
import CommissionLog from "@/models/CommissionLog";
import AuditLog from "@/models/AuditLog";
import { z } from "zod";

const bounceSchema = z.object({
  paymentHistoryId: z.string().min(1, "Payment history ID is required"),
  bounceReason: z.string().min(1, "Bounce reason is required"),
  bankCharges: z.number().nonnegative().optional(),
  notes: z.string().optional()
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
    const parsed = bounceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // RETRY STRATEGY FOR OCC conflicts
    const MAX_RETRIES = 3;
    let attempt = 0;
    let savedPremium = null;

    while (attempt < MAX_RETRIES) {
      const premium = await Premium.findById(params.id);
      if (!premium) {
        return NextResponse.json({ success: false, error: "Premium not found" }, { status: 404 });
      }

      if (session.user.role !== "owner" && premium.agentId.toString() !== session.user.id) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      const currentVersion = premium.__v;

      const txIndex = premium.paymentHistory.findIndex(
        (tx: any) => tx._id.toString() === data.paymentHistoryId
      );

      if (txIndex === -1) {
        return NextResponse.json({ success: false, error: "Payment transaction not found in history" }, { status: 404 });
      }

      if (premium.paymentHistory[txIndex].isBounced) {
        return NextResponse.json({ success: true, message: "Payment already marked as bounced" });
      }

      // Modify the specific array item in memory
      premium.paymentHistory[txIndex].isBounced = true;
      premium.paymentHistory[txIndex].bounceReason = data.bounceReason;
      if (data.bankCharges) premium.paymentHistory[txIndex].bankCharges = data.bankCharges;
      if (data.notes) premium.paymentHistory[txIndex].notes = data.notes;

      // Mutates paidAmount, balanceAmount, status correctly based on remaining non-bounced transactions
      premium.recalculateState();

      const updateSet: any = {
        [`paymentHistory.${txIndex}.isBounced`]: true,
        [`paymentHistory.${txIndex}.bounceReason`]: data.bounceReason,
        paidAmount: premium.paidAmount,
        balanceAmount: premium.balanceAmount,
        status: premium.status,
      };

      if (data.bankCharges !== undefined) updateSet[`paymentHistory.${txIndex}.bankCharges`] = data.bankCharges;
      if (data.notes !== undefined) updateSet[`paymentHistory.${txIndex}.notes`] = data.notes;

      // Attempt Save via OCC
      const updateResult = await Premium.findOneAndUpdate(
        { _id: premium._id, __v: currentVersion },
        {
          $set: updateSet,
          $inc: { __v: 1 }
        },
        { new: true }
      );

      if (updateResult) {
        savedPremium = updateResult;
        break;
      } else {
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
      return NextResponse.json({ success: false, error: "Bounce recording failed to resolve." }, { status: 500 });
    }

    // Reverse the CommissionLog associated carefully
    await CommissionLog.findOneAndUpdate(
      { paymentHistoryId: data.paymentHistoryId, premiumId: savedPremium._id },
      {
        $set: {
          status: "adjusted",
          notes: `Reversed due to cheque bounce: ${data.bounceReason}`
        }
      }
    );

    await AuditLog.create({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Premium",
      details: `Recorded bounce for payment ${data.paymentHistoryId} on premium ${savedPremium._id}. Reason: ${data.bounceReason}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, premium: savedPremium });

  } catch (error: any) {
    console.error("[PREMIUM_BOUNCE_PATCH]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
