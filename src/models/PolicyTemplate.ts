import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPolicyTemplate extends Document {
  agentId: Types.ObjectId;
  agencyId: Types.ObjectId;
  templateName: string;
  // Stores all Steps 2–4 data (insurerId, planName, type, coverage, premium fields)
  // Does NOT store: clientId, policyNumber, startDate, maturityDate, expiryDate, documentUrl
  templateData: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PolicyTemplateSchema = new Schema<IPolicyTemplate>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    templateName: { type: String, required: true, trim: true },
    templateData: { type: Schema.Types.Mixed, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PolicyTemplateSchema.index({ agentId: 1 });
PolicyTemplateSchema.index({ agencyId: 1 });

export default mongoose.models.PolicyTemplate ||
  mongoose.model<IPolicyTemplate>("PolicyTemplate", PolicyTemplateSchema);
