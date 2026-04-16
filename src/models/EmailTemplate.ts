import mongoose, { Schema, Document } from "mongoose";

export interface IEmailTemplate extends Document {
  name: string;
  type: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
  lastEditedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    subject: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    variables: [{ type: String }],
    lastEditedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);
