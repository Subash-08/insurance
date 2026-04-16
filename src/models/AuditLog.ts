import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  userRole: "owner" | "employee";
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "STATUS_CHANGE";
  entity: "Insurer" | "Client" | "Policy" | "Premium" | "Claim" | "Lead" | "User" | "Auth";
  entityId?: Types.ObjectId;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  details?: string; // human-readable description
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userRole: { type: String, enum: ["owner", "employee"] },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "STATUS_CHANGE"],
      required: true,
    },
    entity: {
      type: String,
      enum: ["Insurer", "Client", "Policy", "Premium", "Claim", "Lead", "User", "Auth"],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId },
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
    details: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false, // using explicit timestamp field
    // Automatically expire audit logs after 2 years (optional — remove if you want forever)
    // expireAfterSeconds: 63072000,
  }
);

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
