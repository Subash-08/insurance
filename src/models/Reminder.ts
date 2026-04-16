import mongoose, { Schema, Document } from "mongoose";

export interface IReminder extends Document {
  clientId: mongoose.Types.ObjectId;
  policyId?: mongoose.Types.ObjectId;
  type: string;
  scheduledDate: Date;
  channel: string;
  templateId?: mongoose.Types.ObjectId;
  status: string;
  sentAt?: Date;
  deliveryStatus?: string;
  openedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  isAuto: boolean;
}

const ReminderSchema = new Schema<IReminder>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    policyId: { type: Schema.Types.ObjectId, ref: "Policy" },
    type: { type: String, required: true },
    scheduledDate: { type: Date, required: true, index: true },
    channel: { type: String, required: true },
    templateId: { type: Schema.Types.ObjectId, ref: "EmailTemplate" },
    status: { type: String, required: true, index: true },
    sentAt: { type: Date },
    deliveryStatus: { type: String },
    openedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    isAuto: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Reminder || mongoose.model<IReminder>("Reminder", ReminderSchema);
