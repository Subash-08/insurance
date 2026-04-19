import mongoose, { Schema, Document } from "mongoose";

export interface IShareLink {
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  accessCount: number;
  maxAccessCount: number;
  accessedAt?: Date;
  accessedByIp?: string;
  accessedByUserAgent?: string;
  createdAt: Date;
}

export interface IDocument extends Document {
  agentId: mongoose.Types.ObjectId;
  agencyId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  mimeType: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  sizeBytes: number;
  
  // What does this document belong to?
  entityType: "Client" | "Policy" | "Claim" | "Lead" | "Agency";
  entityId: mongoose.Types.ObjectId;
  
  // Categorization
  documentType: "identity" | "address" | "medical" | "rc_book" | "previous_policy" | "income_proof" | "policy_schedule" | "proposal_form" | "receipt" | "claim_form" | "other";
  expiryDate?: Date;
  status: "active" | "expired" | "archived";
  
  // Security sharing
  shareLinks: IShareLink[];
  
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShareLinkSchema = new Schema<IShareLink>(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    accessCount: { type: Number, default: 0 },
    maxAccessCount: { type: Number, default: 2 },
    accessedAt: { type: Date },
    accessedByIp: { type: String },
    accessedByUserAgent: { type: String },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const DocumentSchema = new Schema<IDocument>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    fileName: { type: String, required: true },
    fileType: { type: String, required: true }, // e.g. "pdf", "jpg"
    mimeType: { type: String, required: true }, // e.g. "application/pdf"
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    
    entityType: { 
      type: String, 
      enum: ["Client", "Policy", "Claim", "Lead", "Agency"],
      required: true 
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    
    documentType: {
      type: String,
      enum: ["identity", "address", "medical", "rc_book", "previous_policy", "income_proof", "policy_schedule", "proposal_form", "receipt", "claim_form", "other"],
      required: true,
      default: "other"
    },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "expired", "archived"],
      default: "active"
    },
    
    shareLinks: [ShareLinkSchema],
    
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
DocumentSchema.index({ agencyId: 1, agentId: 1 });
DocumentSchema.index({ entityType: 1, entityId: 1 });
DocumentSchema.index({ "shareLinks.token": 1 }); // Required for O(1) public lookups

export default mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
