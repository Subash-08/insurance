import mongoose, { Schema, Document, Types } from "mongoose";

// MONEY: All monetary values stored as integers in PAISE (₹1 = 100 paise)

export type PremiumStatus =
  | "upcoming"
  | "due"
  | "overdue"
  | "paid"
  | "partially_paid"
  | "bounced"
  | "waived"
  | "ecs_pending"
  | "ecs_failed"
  | "cancelled";

export interface IPaymentHistory {
  _id?: Types.ObjectId;
  amount: number; // In paise
  date: Date;
  mode: "cash" | "cheque" | "upi" | "neft" | "rtgs" | "online" | "ecs" | "nach";
  receiptNumber?: string;
  utrNumber?: string;
  bankName?: string;
  chequeNumber?: string;
  isBounced: boolean;
  bounceReason?: string;
  bankCharges?: number;
  idempotencyKey: string;
  notes?: string;
  receiptPhoto?: string;
  recordedBy: Types.ObjectId;
}

export interface IPremium extends Document {
  policyId: Types.ObjectId;
  clientId: Types.ObjectId;
  agentId: Types.ObjectId;
  agencyId: Types.ObjectId;
  
  dueDate: Date;
  amount: number; // original expected total premium in PAISE (premiumAmount + gstAmount)
  paidAmount: number; // derived dynamically from paymentHistory where isBounced is false
  balanceAmount: number; // amount - paidAmount
  
  gracePeriodDays: number;
  status: PremiumStatus;
  
  paymentHistory: IPaymentHistory[];
  usedIdempotencyKeys: string[]; // Root level unique strings
  
  waiveReason?: string;
  failedEcsAttempts: number;
  notes?: string;
  
  // Instance method for strict derivation
  recalculateState(): void;
  
  createdAt: Date;
  updatedAt: Date;
}

const PaymentHistorySchema = new Schema<IPaymentHistory>(
  {
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    mode: {
      type: String,
      enum: ["cash", "cheque", "upi", "neft", "rtgs", "online", "ecs", "nach"],
      required: true,
    },
    receiptNumber: { type: String },
    utrNumber: { type: String },
    bankName: { type: String },
    chequeNumber: { type: String },
    isBounced: { type: Boolean, default: false },
    bounceReason: { type: String },
    bankCharges: { type: Number },
    idempotencyKey: { type: String, required: true },
    notes: { type: String },
    receiptPhoto: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: true, timestamps: true } // Auto-generates local _id
);

const PremiumSchema = new Schema<IPremium>(
  {
    policyId: { type: Schema.Types.ObjectId, ref: "Policy", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true }, // in PAISE
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true }, // Should default to amount in pre-save if new
    
    gracePeriodDays: { type: Number, default: 30 },
    status: {
      type: String,
      enum: [
        "upcoming",
        "due",
        "overdue",
        "paid",
        "partially_paid",
        "bounced",
        "waived",
        "ecs_pending",
        "ecs_failed",
        "cancelled",
      ],
      required: true,
      default: "upcoming",
    },
    
    paymentHistory: [PaymentHistorySchema],
    usedIdempotencyKeys: [{ type: String }],
    
    waiveReason: { type: String },
    failedEcsAttempts: { type: Number, default: 0 },
    notes: { type: String },
  },
  { 
    timestamps: true,
    optimisticConcurrency: true, // Enables true __v checking
  }
);

// Derived state repair helper
PremiumSchema.methods.recalculateState = function () {
  if (this.status === "waived" || this.status === "cancelled") {
    // Keep waived / cancelled logic separate if needed, 
    // but the rule is waived => balanceAmount=0, paidAmount=0
    if (this.status === "waived") {
      this.paidAmount = 0;
      this.balanceAmount = 0;
    }
    return;
  }

  // Sum non-bounced histories
  let computedPaid = 0;
  if (this.paymentHistory && this.paymentHistory.length > 0) {
    computedPaid = this.paymentHistory.reduce((sum: number, tx: any) => {
      return !tx.isBounced ? sum + tx.amount : sum;
    }, 0);
  }

  this.paidAmount = computedPaid;
  this.balanceAmount = Math.max(0, this.amount - this.paidAmount);

  // Status mapping
  if (this.balanceAmount === 0) {
    this.status = "paid";
  } else if (this.paidAmount > 0) {
    this.status = "partially_paid";
  } else if (this.status === "ecs_pending") {
    // ecs_pending is an explicit override state waiting for bank webhook/confirm
    // Do nothing to alter it just by recalculation unless changed explicitly.
  } else {
    // Compute due vs overdue based on dates
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today
    
    const dueTime = new Date(this.dueDate);
    dueTime.setHours(0, 0, 0, 0);
    
    const graceTime = new Date(dueTime);
    graceTime.setDate(graceTime.getDate() + this.gracePeriodDays);

    if (today > graceTime) {
      this.status = "overdue";
    } else if (today >= dueTime && today <= graceTime) {
      this.status = "due";
    } else {
      this.status = "upcoming";
    }
  }
};

PremiumSchema.index({ policyId: 1, dueDate: 1 });
PremiumSchema.index({ clientId: 1 });
PremiumSchema.index({ agentId: 1, dueDate: 1, status: 1 }); // Required for stats scaling
PremiumSchema.index({ agencyId: 1 });
PremiumSchema.index({ status: 1 });
PremiumSchema.index({ dueDate: 1 });

// HARD DB CONSTRAINT for Idempotency keys at the root array
PremiumSchema.index(
  { usedIdempotencyKeys: 1 }, 
  { unique: true, sparse: true }
);

export default mongoose.models.Premium ||
  mongoose.model<IPremium>("Premium", PremiumSchema);
