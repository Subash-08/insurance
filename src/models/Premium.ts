import mongoose, { Schema, Document, Types } from "mongoose";

// MONEY: All monetary values stored as integers in PAISE (₹1 = 100 paise)

// PREMIUM STATUS LOGIC:
// "upcoming" → dueDate > today
// "due"      → dueDate <= today AND dueDate >= (today - gracePeriodDays)
// "overdue"  → dueDate < (today - gracePeriodDays) AND not paid
// "paid"     → paidDate is set
// "cancelled"→ policy lapsed/surrendered
//
// HEALTH SCORE uses gracePeriodDays-aware overdue check:
// overdue = today > dueDate + gracePeriodDays (not just today > dueDate)

export type PremiumStatus = "upcoming" | "due" | "overdue" | "paid" | "cancelled";

export interface IPremium extends Document {
  policyId: Types.ObjectId;
  clientId: Types.ObjectId;
  agentId: Types.ObjectId;
  agencyId: Types.ObjectId;
  dueDate: Date;
  amount: number; // total premium in PAISE (premiumAmount + gstAmount)
  gracePeriodDays: number; // copied from policy at creation — used for status computation
  status: PremiumStatus;
  paidDate?: Date;
  paymentMode?: "cash" | "cheque" | "upi" | "neft" | "rtgs" | "online";
  receiptNumber?: string;
  utrNumber?: string;
  bankName?: string;
  chequeNumber?: string;
  notes?: string;
  receiptPhoto?: string; // Cloudinary URL
  createdAt: Date;
  updatedAt: Date;
}

const PremiumSchema = new Schema<IPremium>(
  {
    policyId: { type: Schema.Types.ObjectId, ref: "Policy", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true }, // in PAISE
    gracePeriodDays: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ["upcoming", "due", "overdue", "paid", "cancelled"],
      required: true,
      default: "upcoming",
    },
    paidDate: { type: Date },
    paymentMode: {
      type: String,
      enum: ["cash", "cheque", "upi", "neft", "rtgs", "online"],
    },
    receiptNumber: { type: String },
    utrNumber: { type: String },
    bankName: { type: String },
    chequeNumber: { type: String },
    notes: { type: String },
    receiptPhoto: { type: String },
  },
  { timestamps: true }
);

PremiumSchema.index({ policyId: 1, dueDate: 1 });
PremiumSchema.index({ clientId: 1 });
PremiumSchema.index({ agentId: 1 });
PremiumSchema.index({ agencyId: 1 });
PremiumSchema.index({ status: 1 });
PremiumSchema.index({ dueDate: 1 });

export default mongoose.models.Premium ||
  mongoose.model<IPremium>("Premium", PremiumSchema);
