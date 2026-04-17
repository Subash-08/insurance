import mongoose, { Schema } from "mongoose";

const SmsVersionSchema = new Schema({
  version: { type: Number },
  bodyText: { type: String },
  savedAt: { type: Date, default: Date.now },
  savedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { _id: false });

const SmsTemplateSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["renewal", "premium_due", "premium_overdue", "lapse_warning", "birthday", "anniversary", "maturity", "welcome", "claim_ack", "payment_confirmation", "custom"],
    required: true,
  },
  bodyText: { type: String, maxlength: 160 },
  variables: [{ type: String }],
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  versionHistory: [SmsVersionSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  lastEditedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.models.SmsTemplate ||
  mongoose.model("SmsTemplate", SmsTemplateSchema);
