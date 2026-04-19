import mongoose from "mongoose";

export interface INotification extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  agencyId: mongoose.Types.ObjectId;
  type:
    | "dispute_raised"
    | "lead_converted"
    | "premium_overdue_30d"
    | "policy_expiring_7d"
    | "commission_paid"
    | "commission_log_failed"
    | "document_expiring"
    | "agent_joined"
    | "claim_settled";
  title: string;
  message: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  entityUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "dispute_raised",
        "lead_converted",
        "premium_overdue_30d",
        "policy_expiring_7d",
        "commission_paid",
        "commission_log_failed",
        "document_expiring",
        "agent_joined",
        "claim_settled",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityUrl: { type: String },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL — auto-expire after 180 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
// Primary access pattern
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ agencyId: 1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
