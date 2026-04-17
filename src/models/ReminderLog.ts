import mongoose, { Schema } from "mongoose";

const ReminderLogSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
  policyId: { type: Schema.Types.ObjectId, ref: "Policy" },
  premiumId: { type: Schema.Types.ObjectId, ref: "Premium" },
  templateId: { type: Schema.Types.ObjectId, ref: "EmailTemplate" },
  templateSlug: { type: String, index: true },
  channel: { type: String, enum: ["email", "sms", "whatsapp"], required: true },
  recipientEmail: { type: String },
  recipientPhone: { type: String },
  subject: { type: String },
  body: { type: String },
  status: {
    type: String,
    enum: ["pending", "sent", "delivered", "opened", "clicked", "failed", "bounced", "opted_out"],
    default: "pending",
    index: true,
  },
  sentAt: { type: Date, index: true },
  deliveredAt: { type: Date },
  openedAt: { type: Date },
  failureReason: { type: String },
  triggeredBy: { type: String, enum: ["cron", "manual", "n8n_callback", "deep_link"], default: "cron" },
  triggeredByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  n8nExecutionId: { type: String },
}, { timestamps: true });

ReminderLogSchema.index({ clientId: 1 });
ReminderLogSchema.index({ policyId: 1 });

export default mongoose.models.ReminderLog ||
  mongoose.model("ReminderLog", ReminderLogSchema);
