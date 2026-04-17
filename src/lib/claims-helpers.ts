// ─── Types ───────────────────────────────────────────────────────────────────

export type ClaimType =
  | "death"
  | "maturity"
  | "accident"
  | "health"
  | "vehicle"
  | "fire"
  | "travel"
  | "critical_illness";

export type ClaimStatus =
  | "filed"
  | "documents_submitted"
  | "under_insurer_review"
  | "additional_info_required"
  | "approved"
  | "settlement_received"
  | "closed"
  | "rejected";

export interface DocumentRequirement {
  docType: string;
  label: string;
  required: boolean;
}

export interface DocumentItem extends DocumentRequirement {
  received: boolean;
  receivedAt?: Date;
  fileUrl?: string;
  notes?: string;
}

// ─── Document Requirements per claim type ────────────────────────────────────

export const DOCUMENT_REQUIREMENTS: Record<ClaimType, DocumentRequirement[]> = {
  death: [
    { docType: "death_certificate", label: "Death Certificate", required: true },
    { docType: "original_policy_doc", label: "Original Policy Document", required: true },
    { docType: "id_proof_nominee", label: "ID Proof of Nominee", required: true },
    { docType: "bank_details", label: "Bank Details (Cancelled Cheque)", required: true },
    { docType: "cause_of_death_certificate", label: "Cause of Death Certificate", required: true },
    { docType: "hospital_records_if_applicable", label: "Hospital Records (if applicable)", required: false },
    { docType: "claimant_statement", label: "Claimant Statement Form", required: true },
  ],
  maturity: [
    { docType: "original_policy_doc", label: "Original Policy Document", required: true },
    { docType: "id_proof", label: "Identity Proof (Aadhar/PAN)", required: true },
    { docType: "bank_details", label: "Bank Details (Cancelled Cheque)", required: true },
    { docType: "discharge_form", label: "Discharge Form", required: true },
  ],
  health: [
    { docType: "claim_form", label: "Claim Form", required: true },
    { docType: "hospital_bills", label: "Hospital Bills (Itemized)", required: true },
    { docType: "discharge_summary", label: "Hospital Discharge Summary", required: true },
    { docType: "prescription", label: "Doctor Prescriptions", required: true },
    { docType: "lab_reports", label: "Lab/Diagnostic Reports", required: false },
    { docType: "id_proof", label: "Identity Proof", required: true },
    { docType: "policy_copy", label: "Policy Copy", required: true },
  ],
  vehicle: [
    { docType: "fir_copy_if_theft", label: "FIR Copy (for theft)", required: false },
    { docType: "repair_estimate", label: "Repair Estimate", required: true },
    { docType: "rc_book", label: "RC Book / Registration Certificate", required: true },
    { docType: "driving_license", label: "Driving License", required: true },
    { docType: "surveyor_report", label: "Insurance Surveyor Report", required: true },
    { docType: "policy_copy", label: "Policy Copy", required: true },
    { docType: "repair_bills", label: "Final Repair Bills", required: false },
  ],
  accident: [
    { docType: "fir_copy", label: "FIR Copy", required: true },
    { docType: "medical_bills", label: "Medical Bills", required: true },
    { docType: "disability_certificate_if_applicable", label: "Disability Certificate (if applicable)", required: false },
    { docType: "id_proof", label: "Identity Proof", required: true },
    { docType: "claim_form", label: "Claim Form", required: true },
  ],
  fire: [
    { docType: "fir_copy", label: "FIR Copy", required: true },
    { docType: "loss_assessment_report", label: "Loss Assessment Report", required: true },
    { docType: "property_ownership_proof", label: "Property Ownership Documents", required: true },
    { docType: "policy_copy", label: "Policy Copy", required: true },
    { docType: "photographs", label: "Photographs of Damage", required: false },
  ],
  travel: [
    { docType: "claim_form", label: "Travel Claim Form", required: true },
    { docType: "travel_tickets", label: "Travel Tickets/Boarding Pass", required: true },
    { docType: "medical_reports_if_applicable", label: "Medical Reports (if applicable)", required: false },
    { docType: "receipts", label: "Expense Receipts", required: true },
  ],
  critical_illness: [
    { docType: "diagnosis_report", label: "Diagnosis Report", required: true },
    { docType: "specialist_certificate", label: "Specialist Doctor Certificate", required: true },
    { docType: "hospital_records", label: "Hospital Medical Records", required: true },
    { docType: "id_proof", label: "Identity Proof", required: true },
    { docType: "policy_copy", label: "Policy Copy", required: true },
  ],
};

export function buildDocumentChecklist(claimType: ClaimType): DocumentItem[] {
  const requirements = DOCUMENT_REQUIREMENTS[claimType] || [];
  return requirements.map((req) => ({
    ...req,
    received: false,
    receivedAt: undefined,
    fileUrl: undefined,
    notes: undefined,
  }));
}

// ─── Status Transition Table ─────────────────────────────────────────────────

export const VALID_STATUS_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  filed: ["documents_submitted", "rejected"],
  documents_submitted: ["under_insurer_review", "additional_info_required"],
  under_insurer_review: ["additional_info_required", "approved", "rejected"],
  additional_info_required: ["under_insurer_review", "rejected"],
  approved: ["settlement_received", "rejected"],
  settlement_received: ["closed"],
  rejected: [], // terminal — use appeal flow
  closed: [],   // terminal
};

export function validateStatusTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  const allowedNext = VALID_STATUS_TRANSITIONS[from] || [];
  return allowedNext.includes(to);
}

// ─── Urgency Level ───────────────────────────────────────────────────────────

export function getClaimUrgencyLevel(claim: {
  daysPending: number;
  status: ClaimStatus | string;
}): "normal" | "attention" | "urgent" {
  const { daysPending, status } = claim;
  if (status === "additional_info_required" || daysPending > 30) return "urgent";
  if (daysPending >= 15 && daysPending <= 30) return "attention";
  return "normal";
}

// ─── Estimated processing times ──────────────────────────────────────────────

export const CLAIM_PROCESSING_ESTIMATES: Record<ClaimType, string> = {
  death: "30-90 days",
  maturity: "7-15 days",
  accident: "15-30 days",
  health: "15-30 days",
  vehicle: "7-21 days",
  fire: "30-60 days",
  travel: "7-14 days",
  critical_illness: "15-45 days",
};

// ─── Allowed claim types per policy type ─────────────────────────────────────

export const POLICY_TYPE_CLAIM_MAP: Record<string, ClaimType[]> = {
  life: ["death", "maturity", "critical_illness"],
  health: ["health", "accident", "critical_illness"],
  vehicle: ["vehicle", "accident"],
  ulip: ["death", "maturity"],
  term: ["death", "accident", "critical_illness"],
  fire: ["fire"],
  travel: ["travel", "accident"],
};
