import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  source?: string;
  interest: string[];
  estimatedSA?: number;
  budget?: number;
  stage: string;
  assignedTo?: mongoose.Types.ObjectId;
  followUpDate?: Date;
  followUpLog: any[];
  priority?: string;
  convertedClientId?: mongoose.Types.ObjectId;
  lostReason?: string;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String },
    city: { type: String },
    source: { type: String },
    interest: [{ type: String }],
    estimatedSA: { type: Number },
    budget: { type: Number },
    stage: { type: String, required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    followUpDate: { type: Date },
    followUpLog: [{ type: Schema.Types.Mixed }],
    priority: { type: String },
    convertedClientId: { type: Schema.Types.ObjectId, ref: "Client" },
    lostReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
