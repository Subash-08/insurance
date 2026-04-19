import mongoose, { Schema, Document } from "mongoose";

export interface IFollowUpNote {
  text: string;
  addedBy: mongoose.Types.ObjectId;
  addedAt: Date;
  nextFollowUpDate?: Date;
  contactMethod?: string;
}

export interface ILead extends Document {
  agentId: mongoose.Types.ObjectId;
  agencyId: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  source: string;
  referredByClientId?: mongoose.Types.ObjectId;
  interestedIn: string[];
  estimatedBudget?: number;
  estimatedSumAssured?: number;
  stage: "new_inquiry" | "contacted" | "proposal_sent" | "negotiation" | "won" | "lost";
  lostReason?: string;
  wonClientId?: mongoose.Types.ObjectId;
  priority: "low" | "medium" | "high";
  followUpNotes: IFollowUpNote[];
  nextFollowUpDate?: Date;
  lastContactedAt?: Date;
  agingAlertSent: boolean;
  convertedAt?: Date;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    city: { type: String },
    state: { type: String },
    source: {
      type: String,
      enum: ["referral", "website", "social_media", "cold_call", "walk_in", "other"],
      default: "other",
    },
    referredByClientId: { type: Schema.Types.ObjectId, ref: "Client" },
    interestedIn: [{ type: String }],
    estimatedBudget: { type: Number },
    estimatedSumAssured: { type: Number },
    stage: {
      type: String,
      enum: ["new_inquiry", "contacted", "proposal_sent", "negotiation", "won", "lost"],
      default: "new_inquiry",
    },
    lostReason: { type: String },
    wonClientId: { type: Schema.Types.ObjectId, ref: "Client" },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    followUpNotes: [
      {
        text: String,
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
        nextFollowUpDate: Date,
        contactMethod: String,
      },
    ],
    nextFollowUpDate: { type: Date },
    lastContactedAt: { type: Date },
    agingAlertSent: { type: Boolean, default: false },
    convertedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
