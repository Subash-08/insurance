import mongoose, { Schema } from "mongoose";

const WhatsAppTemplateSchema = new Schema({
  key: { type: String, required: true, unique: true }, // matches WHATSAPP_MESSAGE_TEMPLATES keys
  label: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.WhatsAppTemplate ||
  mongoose.model("WhatsAppTemplate", WhatsAppTemplateSchema);
