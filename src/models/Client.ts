import mongoose, { Schema, Document, Types } from "mongoose";

// MONEY: All monetary values stored as integers in PAISE (₹1 = 100 paise)
// Display: divide by 100 and use Intl.NumberFormat('en-IN')

// TECH DEBT: agencyId = owner's _id for now (single-agency deployment).
// Future: create a separate Agency collection for multi-owner / SaaS support.

export interface INominee {
  _id: Types.ObjectId;
  name: string;
  relationship: "spouse" | "child" | "parent" | "sibling" | "other";
  dob?: Date;
  phone?: string;
  share: number; // percentage, all nominees must sum to 100
  isMinor: boolean; // auto-computed: dob < 18 years ago
  guardianName?: string; // required if isMinor
}

export interface IClientNote {
  _id: Types.ObjectId;
  text: string;
  addedBy: Types.ObjectId;
  addedAt: Date;
}

export interface IClient extends Document {
  agentId: Types.ObjectId;
  agencyId: Types.ObjectId; // owner's _id — tech debt, see above
  fullName: string;
  dob?: Date;
  gender?: "male" | "female" | "other";
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  occupation?: string;
  annualIncome?: number; // in paise
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string; // default: "India"
  };
  panNumber?: string; // stored uppercase
  aadhaarLast4?: string; // ONLY last 4 digits — never full Aadhaar
  photo?: string; // Cloudinary URL
  nominees: INominee[];
  medicalHistory?: {
    existingConditions?: string[];
    smoker?: boolean;
    diabetic?: boolean;
    hypertensive?: boolean;
    surgeries?: string[];
    bloodGroup?: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-" | "Unknown";
  };
  tags: string[];
  referredBy?: Types.ObjectId; // ref Client
  notes: IClientNote[]; // APPEND-ONLY — never edit or delete
  status: "active" | "inactive";
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NomineeSchema = new Schema<INominee>(
  {
    name: { type: String, required: true },
    relationship: {
      type: String,
      enum: ["spouse", "child", "parent", "sibling", "other"],
      required: true,
    },
    dob: { type: Date },
    phone: { type: String },
    share: { type: Number, required: true, min: 0, max: 100 },
    isMinor: { type: Boolean, default: false },
    guardianName: { type: String },
  },
  { _id: true }
);

const ClientNoteSchema = new Schema<IClientNote>(
  {
    text: { type: String, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ClientSchema = new Schema<IClient>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
    },
    occupation: { type: String },
    annualIncome: { type: Number }, // in paise
    phone: { type: String, required: true },
    secondaryPhone: { type: String },
    email: { type: String, lowercase: true, trim: true },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: "India" },
    },
    panNumber: { type: String, uppercase: true },
    aadhaarLast4: { type: String }, // ONLY last 4 digits
    photo: { type: String },
    nominees: { type: [NomineeSchema], default: [] },
    medicalHistory: {
      existingConditions: [{ type: String }],
      smoker: { type: Boolean },
      diabetic: { type: Boolean },
      hypertensive: { type: Boolean },
      surgeries: [{ type: String }],
      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"],
      },
    },
    tags: [{ type: String }],
    referredBy: { type: Schema.Types.ObjectId, ref: "Client" },
    notes: { type: [ClientNoteSchema], default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound indexes for agency-scoped uniqueness
ClientSchema.index({ agencyId: 1, phone: 1 }, { unique: true });
ClientSchema.index({ agencyId: 1, panNumber: 1 }, { unique: true, sparse: true });
ClientSchema.index({ agentId: 1 });
ClientSchema.index({ agencyId: 1 });
ClientSchema.index({ isActive: 1 });
ClientSchema.index({ fullName: "text", phone: "text", email: "text" });

export default mongoose.models.Client ||
  mongoose.model<IClient>("Client", ClientSchema);
