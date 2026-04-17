import mongoose, { Schema, Document } from "mongoose";

export interface ISysCounter extends Document {
  _id: string;
  year: number;
  seq: number;
}

const SysCounterSchema = new Schema<ISysCounter>({
  _id: { type: String, required: true },
  year: { type: Number, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.models.SysCounter ||
  mongoose.model<ISysCounter>("SysCounter", SysCounterSchema);
