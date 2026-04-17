import mongoose, { Schema } from "mongoose";

const VersionHistorySchema = new Schema({
  version: { type: Number },
  bodyHtml: { type: String },
  subject: { type: String },
  savedAt: { type: Date, default: Date.now },
  savedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { _id: false });

const EmailTemplateSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["renewal", "premium_due", "premium_overdue", "lapse_warning", "birthday", "anniversary", "maturity", "welcome", "claim_ack", "payment_confirmation", "custom"],
    required: true,
  },
  channel: { type: String, enum: ["email", "sms", "whatsapp", "all"], default: "email" },
  subject: { type: String },
  bodyHtml: { type: String },
  bodyText: { type: String },
  variables: [{ type: String }],
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  versionHistory: [VersionHistorySchema],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  lastEditedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.models.EmailTemplate ||
  mongoose.model("EmailTemplate", EmailTemplateSchema);
