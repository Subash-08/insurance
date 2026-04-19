import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICommissionLog extends Document {
  premiumId: Types.ObjectId;
  paymentHistoryId: Types.ObjectId; // Strict mapping to the specific transaction
  policyId: Types.ObjectId;
  clientId: Types.ObjectId;
  agentId: Types.ObjectId;
  agencyId: Types.ObjectId;
  insurerId: Types.ObjectId;
  policyType: string;
  paidAmount: number; // in paise, what commission was actually calculated on
  commissionRate: number; // %
  commissionAmount: number; // calculated in paise
  month: string; // YYYY-MM
  status: "pending" | "paid" | "adjusted";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionLogSchema = new Schema<ICommissionLog>(
  {
    premiumId: { type: Schema.Types.ObjectId, ref: "Premium", required: true },
    paymentHistoryId: { type: Schema.Types.ObjectId, required: true },
    policyId: { type: Schema.Types.ObjectId, ref: "Policy", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "Agency", required: true },
    insurerId: { type: Schema.Types.ObjectId, ref: "Insurer", required: true },
    policyType: { type: String, required: true },
    paidAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    month: { type: String, required: true }, // Format YYYY-MM
    status: {
      type: String,
      enum: ["pending", "paid", "adjusted"],
      default: "pending",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// HARD CONSTRAINTS
CommissionLogSchema.index({ paymentHistoryId: 1 }, { unique: true }); // Prevent double commissioning on same payment
CommissionLogSchema.index({ agentId: 1, month: 1 });
CommissionLogSchema.index({ status: 1 });

export default mongoose.models.CommissionLog ||
  mongoose.model<ICommissionLog>("CommissionLog", CommissionLogSchema);
