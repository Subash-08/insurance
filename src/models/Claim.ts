import mongoose, { Schema, Document, Types } from "mongoose";

// ─── Sub-schemas ────────────────────────────────────────────────────────────

const DocumentItemSchema = new Schema({
  docType: { type: String, required: true },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  received: { type: Boolean, default: false },
  receivedAt: { type: Date },
  fileUrl: { type: String },
  notes: { type: String },
}, { _id: true }); // _id: true — updates always go via document._id, never by index

const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  changedAt: { type: Date, default: Date.now },
  notes: { type: String },
}, { _id: false });

const AppealDocSchema = new Schema({
  docType: { type: String },
  fileUrl: { type: String },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

// appeals: append-only array (not a single object — multiple appeals supported)
const AppealSchema = new Schema({
  appealDate: { type: Date, default: Date.now },
  appealReason: { type: String, required: true },
  appealStatus: {
    type: String,
    enum: ["filed", "under_review", "upheld", "dismissed"],
    default: "filed",
  },
  filedBy: { type: Schema.Types.ObjectId, ref: "User" },
  appealDocuments: [AppealDocSchema],
  notes: { type: String },
  resolvedAt: { type: Date },
}, { _id: true, timestamps: true });

const SettlementSchema = new Schema({
  settlementAmount: { type: Number }, // paise
  tdsDeducted: { type: Number, default: 0 }, // paise
  netPayout: { type: Number }, // paise — auto-calculated
  isPartial: { type: Boolean, default: false },
  settlementDate: { type: Date },
  paymentMode: { type: String, enum: ["neft", "cheque", "rtgs"] },
  bankAccount: { type: String }, // last 4 digits only
  ifscCode: { type: String },
  accountHolderName: { type: String },
  settlementLetterUrl: { type: String },
  settledBy: { type: Schema.Types.ObjectId, ref: "User" },
  notes: { type: String },
}, { _id: false });

// ─── Main Claim Schema ───────────────────────────────────────────────────────

export interface IClaim extends Document {
  claimNumber: string;
  policyId: Types.ObjectId;
  clientId: Types.ObjectId;
  agentId: Types.ObjectId;
  insurerClaimNumber?: string;
  claimType: string;
  incidentDate: Date;
  description: string;
  estimatedAmount: number;
  hospitalName?: string;
  garageName?: string;
  doctorName?: string;
  vehicleRegistration?: string;
  status: string;
  statusHistory: any[];
  documents: any[];
  settlement?: any;
  appeals: any[];
  rejectionReason?: string;
  isLapsedPolicyWarning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    claimNumber: { type: String, unique: true },
    policyId: { type: Schema.Types.ObjectId, ref: "Policy", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    insurerClaimNumber: { type: String },
    claimType: {
      type: String,
      enum: ["death", "maturity", "accident", "health", "vehicle", "fire", "travel", "critical_illness"],
      required: true,
    },
    incidentDate: { type: Date, required: true },
    description: { type: String, required: true, maxlength: 2000 },
    estimatedAmount: { type: Number, required: true },
    hospitalName: { type: String },
    garageName: { type: String },
    doctorName: { type: String },
    vehicleRegistration: { type: String },
    status: {
      type: String,
      enum: [
        "filed",
        "documents_submitted",
        "under_insurer_review",
        "additional_info_required",
        "approved",
        "settlement_received",
        "closed",
        "rejected",
      ],
      default: "filed",
    },
    statusHistory: [StatusHistorySchema],
    documents: [DocumentItemSchema],
    settlement: SettlementSchema,
    appeals: [AppealSchema],
    rejectionReason: { type: String },
    isLapsedPolicyWarning: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
ClaimSchema.index({ clientId: 1 });
ClaimSchema.index({ policyId: 1 });
ClaimSchema.index({ agentId: 1 });
ClaimSchema.index({ status: 1 });
ClaimSchema.index({ claimType: 1 });
ClaimSchema.index({ createdAt: -1 });
// Compound for duplicate detection — used by POST /api/claims check
ClaimSchema.index({ policyId: 1, claimType: 1, status: 1 });

// ─── Pre-save: atomic claim number via SysCounter ─────────────────────────────
ClaimSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const year = new Date().getFullYear();
  const counterId = `claim_${year}`;

  const SysCounter = mongoose.models.SysCounter ||
    mongoose.model("SysCounter", new Schema({
      _id: { type: String },
      year: { type: Number },
      seq: { type: Number, default: 0 },
    }));

  // $inc + upsert is atomic — safe for concurrent creates
  const counter: any = await SysCounter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 }, $set: { year } },
    { upsert: true, new: true }
  );

  const padded = String(counter.seq).padStart(5, "0");
  this.claimNumber = `CLM-${year}-${padded}`;
  next();
});

export default mongoose.models.Claim ||
  mongoose.model<IClaim>("Claim", ClaimSchema);
