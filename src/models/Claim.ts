import mongoose, { Schema, Document } from "mongoose";

export interface IClaim extends Document {
  claimNumber: string;
  policyId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  claimType: string;
  incidentDate: Date;
  description: string;
  estimatedAmount?: number;
  hospitalName?: string;
  documents: Array<{ title: string; url: string; isVerified: boolean }>;
  status: string;
  settlementDetails?: any;
  timeline: Array<{ status: string; date: Date; note: string }>;
}

const ClaimSchema = new Schema<IClaim>(
  {
    claimNumber: { type: String, unique: true, required: true },
    policyId: { type: Schema.Types.ObjectId, ref: "Policy", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    claimType: { type: String, required: true },
    incidentDate: { type: Date, required: true },
    description: { type: String, required: true },
    estimatedAmount: { type: Number },
    hospitalName: { type: String },
    documents: [
      {
        title: { type: String },
        url: { type: String },
        isVerified: { type: Boolean, default: false },
      },
    ],
    status: { type: String, required: true, index: true },
    settlementDetails: { type: Schema.Types.Mixed },
    timeline: [
      {
        status: { type: String },
        date: { type: Date },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Claim || mongoose.model<IClaim>("Claim", ClaimSchema);
