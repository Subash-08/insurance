import mongoose from "mongoose";
import CommissionLog from "@/models/CommissionLog";
import Insurer from "@/models/Insurer";

export function calculateCommission(paidAmountPaise: number, commissionRatePct: number): number {
  return Math.round((paidAmountPaise * commissionRatePct) / 100);
}

export async function createCommissionLogEntry(params: {
  premiumId: mongoose.Types.ObjectId | string;
  paymentHistoryId: mongoose.Types.ObjectId | string;
  policyId: mongoose.Types.ObjectId | string;
  clientId: mongoose.Types.ObjectId | string;
  agentId: mongoose.Types.ObjectId | string;
  insurerId: mongoose.Types.ObjectId | string;
  policyType: string;
  paidAmount: number;
  paymentDate: Date;
}) {
  try {
    const insurer: any = await Insurer.findById(params.insurerId).lean();
    if (!insurer) {
      console.warn(`[COMMISSION] Insurer ${params.insurerId} not found. Skipping commission log.`);
      return null;
    }

    // Attempt to parse out commission rate from insurer config, fallback to 0
    let rate = 0;
    if (insurer.commissionRates && typeof insurer.commissionRates === "object") {
      rate = (insurer.commissionRates as Record<string, number>)[params.policyType] ?? 0;
    }

    if (rate <= 0) {
      console.log(`[COMMISSION] Rate for ${params.policyType} is ${rate}. Log will be created with 0 commission.`);
    }

    const commissionAmount = calculateCommission(params.paidAmount, rate);

    const monthStr = `${params.paymentDate.getFullYear()}-${String(params.paymentDate.getMonth() + 1).padStart(2, "0")}`;

    const newLog = await CommissionLog.create({
      premiumId: new mongoose.Types.ObjectId(params.premiumId),
      paymentHistoryId: new mongoose.Types.ObjectId(params.paymentHistoryId),
      policyId: new mongoose.Types.ObjectId(params.policyId),
      clientId: new mongoose.Types.ObjectId(params.clientId),
      agentId: new mongoose.Types.ObjectId(params.agentId),
      insurerId: new mongoose.Types.ObjectId(params.insurerId),
      policyType: params.policyType,
      paidAmount: params.paidAmount,
      commissionRate: rate,
      commissionAmount,
      month: monthStr,
      status: "pending",
    });

    return newLog;
  } catch (error: any) {
    if (error.code === 11000) {
      console.info(`[COMMISSION] Duplicate commission log creation intercepted for paymentHistoryId ${params.paymentHistoryId}`);
      return null;
    }
    throw error;
  }
}
