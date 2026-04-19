import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInsurerPlan {
  _id: Types.ObjectId;
  planName: string;
  planCode?: string;
  isActive: boolean;
}

export interface IInsurer extends Document {
  name: string;
  type: "life" | "general" | "health" | "composite";
  logoUrl?: string;
  logoPublicId?: string; // Cloudinary public_id for deletion
  email?: string;
  phone?: string;
  claimHelpline?: string; // CRITICAL — agents need this during claims
  website?: string;
  plans: IInsurerPlan[];
  isActive: boolean;
  commissionRates?: Map<string, number>; // Map of policy type -> commission percentage
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IInsurerPlan>(
  {
    planName: { type: String, required: true },
    planCode: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const InsurerSchema = new Schema<IInsurer>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: ["life", "general", "health", "composite"],
      required: true,
    },
    logoUrl: { type: String },
    logoPublicId: { type: String },
    email: { type: String },
    phone: { type: String },
    claimHelpline: { type: String },
    website: { type: String },
    plans: { type: [PlanSchema], default: [] },
    isActive: { type: Boolean, default: true },
    commissionRates: { type: Map, of: Number, default: {} },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes
InsurerSchema.index({ type: 1 });
InsurerSchema.index({ isActive: 1 });

export default mongoose.models.Insurer ||
  mongoose.model<IInsurer>("Insurer", InsurerSchema);
