import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId;
  token: string;
  tokenType: "password_reset" | "email_verify";
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    tokenType: { type: String, enum: ["password_reset", "email_verify"], required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    ipAddress: { type: String }
  },
  { timestamps: true }
);

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetTokenSchema.index({ token: 1 });

export default mongoose.models.PasswordResetToken || mongoose.model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);
