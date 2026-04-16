import mongoose, { Schema, Document } from "mongoose";

export interface ILoginAttempt extends Document {
  ip: string;
  email: string;
  success: boolean;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>(
  {
    ip: { type: String, required: true },
    email: { type: String, required: true },
    success: { type: Boolean, required: true },
    userAgent: { type: String }
  },
  { timestamps: true }
);

LoginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
LoginAttemptSchema.index({ ip: 1, createdAt: 1 });

export default mongoose.models.LoginAttempt || mongoose.model<ILoginAttempt>("LoginAttempt", LoginAttemptSchema);
