import mongoose, { Schema, Document, Types } from "mongoose";

// MONEY: All monetary values stored as integers in PAISE (₹1 = 100 paise)
// Display: divide by 100 and use Intl.NumberFormat('en-IN')

// TECH DEBT: agencyId = owner's _id for now (single-agency deployment).
// Future: create a separate Agency collection for multi-owner / SaaS support.

// POLICY STATE MACHINE — enforced in all API routes that update status
export const POLICY_TRANSITIONS: Record<string, string[]> = {
  active: ["lapsed", "surrendered", "matured"],
  lapsed: ["active"], // revival only
  surrendered: [],    // terminal state
  matured: [],        // terminal state
  claimed: [],        // terminal state
  cancelled: [],      // terminal state
};

export type PolicyStatus =
  | "active"
  | "lapsed"
  | "surrendered"
  | "matured"
  | "claimed"
  | "cancelled";

export interface IPolicy extends Document {
  // Ownership
  agentId: Types.ObjectId;
  agencyId: Types.ObjectId; // owner's _id — tech debt, see above

  // Core references
  clientId: Types.ObjectId;
  insurerId: Types.ObjectId;

  // Policy identity — planName is a SNAPSHOT (immutable after creation)
  // Do not reference the insurer's plans array dynamically — insurer may rename plans
  policyNumber: string;
  planName: string; // snapshot at creation time
  type: "life" | "health" | "vehicle" | "ulip" | "fire" | "travel" | "group" | "term";

  // Dates
  startDate: Date;
  maturityDate?: Date; // required for life/ulip/term
  expiryDate?: Date;   // for health/vehicle (typically 1 year)

  // Financials — stored in PAISE
  sumAssured: number;       // in paise
  premiumAmount: number;    // base premium in paise (before GST)
  gstAmount: number;        // 18% of premiumAmount, in paise
  totalPremium: number;     // premiumAmount + gstAmount, in paise

  // Premium schedule
  paymentFrequency: "monthly" | "quarterly" | "half-yearly" | "yearly" | "single";
  nextPremiumDue?: Date;
  gracePeriodDays: number; // default 30 for life, 15 for health/vehicle

  // Status
  status: PolicyStatus;

  // Type-specific nested data
  lifeDetails?: {
    deathBenefitType?: "lump_sum" | "staggered" | "income_replacement";
    survivalBenefits?: { year: number; amount: number }[];
    loanEligible?: boolean;
    pptYears?: number; // premium payment term
  };
  healthDetails?: {
    coverType?: "individual" | "family_floater" | "group";
    membersInsured?: { name: string; relation: string; dob?: Date; sumInsured?: number }[];
    tpaName?: string;
    tpaId?: string;
    roomRentLimit?: number; // in paise
    coPay?: number; // percentage
    restoreBenefit?: boolean;
    maternityBenefit?: boolean;
    cashlessHospitalNetwork?: string;
    preExistingWaitingPeriod?: number; // months
  };
  vehicleDetails?: {
    registrationNumber?: string;
    make?: string;
    model?: string;
    year?: number;
    fuelType?: "petrol" | "diesel" | "electric" | "cng" | "hybrid";
    vehicleType?: "two_wheeler" | "private_car" | "commercial";
    idv?: number; // Insured Declared Value in paise
    ncbPercent?: number; // 0/20/25/35/45/50
    coverType?: "comprehensive" | "third_party" | "own_damage";
  };
  ulipDetails?: {
    fundAllocation?: { fundName: string; percent: number }[];
    premiumAllocationCharge?: number;
    mortalityCharge?: number;
  };

  // ECS Billing
  ecsEnrolled?: boolean;
  ecsBank?: string;

  // Lifecycle
  renewedFromId?: Types.ObjectId;  // if this is a renewal of another policy
  lapseReason?: string;
  surrenderValue?: number; // in paise
  surrenderDate?: Date;
  surrenderReason?: string;

  // Documents
  documentUrl?: string;    // Cloudinary URL of policy bond PDF
  documentPublicId?: string;

  // Soft delete
  isActive: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    insurerId: { type: Schema.Types.ObjectId, ref: "Insurer", required: true },
    policyNumber: { type: String, required: true, trim: true },
    planName: { type: String, required: true }, // snapshot — never update
    type: {
      type: String,
      enum: ["life", "health", "vehicle", "ulip", "fire", "travel", "group", "term"],
      required: true,
    },
    startDate: { type: Date, required: true },
    maturityDate: { type: Date },
    expiryDate: { type: Date },

    // Financials in PAISE
    sumAssured: { type: Number, required: true, min: 100 }, // min ₹1
    premiumAmount: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalPremium: { type: Number, required: true },

    paymentFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "half-yearly", "yearly", "single"],
      required: true,
    },
    nextPremiumDue: { type: Date },
    gracePeriodDays: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ["active", "lapsed", "surrendered", "matured", "claimed", "cancelled"],
      default: "active",
    },

    // Type-specific (Mixed for flexibility, typed at application layer)
    lifeDetails: { type: Schema.Types.Mixed },
    healthDetails: { type: Schema.Types.Mixed },
    vehicleDetails: { type: Schema.Types.Mixed },
    ulipDetails: { type: Schema.Types.Mixed },

    renewedFromId: { type: Schema.Types.ObjectId, ref: "Policy" },
    lapseReason: { type: String },
    surrenderValue: { type: Number },
    surrenderDate: { type: Date },
    surrenderReason: { type: String },

    ecsEnrolled: { type: Boolean, default: false },
    ecsBank: { type: String },

    documentUrl: { type: String },
    documentPublicId: { type: String },

    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index: policyNumber unique within agency (not globally)
PolicySchema.index({ agencyId: 1, policyNumber: 1 }, { unique: true });
PolicySchema.index({ agentId: 1 });
PolicySchema.index({ clientId: 1 });
PolicySchema.index({ status: 1 });
PolicySchema.index({ nextPremiumDue: 1 });
PolicySchema.index({ expiryDate: 1 });
PolicySchema.index({ maturityDate: 1 });
PolicySchema.index({ isActive: 1 });

export default mongoose.models.Policy ||
  mongoose.model<IPolicy>("Policy", PolicySchema);
