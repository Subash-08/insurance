"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  buildDocumentChecklist,
  CLAIM_PROCESSING_ESTIMATES,
  POLICY_TYPE_CLAIM_MAP,
  DocumentItem,
  ClaimType,
} from "@/lib/claims-helpers";
import { formatCurrency } from "@/lib/utils";

const STEPS = ["Claim Details", "Documents", "Review & Submit"];

export default function FileClaimWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 fields
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [claimType, setClaimType] = useState<ClaimType | "">("");
  const [incidentDate, setIncidentDate] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [garageName, setGarageName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [insurerClaimNumber, setInsurerClaimNumber] = useState("");

  // Step 2 — document checklist
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  // Duplicate warning
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [forceCreate, setForceCreate] = useState(false);

  // Fetch clients
  useEffect(() => {
    if (clientSearch.length < 2) return;
    fetch(`/api/clients?search=${clientSearch}&limit=10`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setClients(d.data); });
  }, [clientSearch]);

  // Fetch policies when client selected
  useEffect(() => {
    if (!selectedClient) return;
    fetch(`/api/policies?clientId=${selectedClient._id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setPolicies(d.data); });
  }, [selectedClient]);

  // Build document checklist when claim type selected
  useEffect(() => {
    if (claimType) setDocuments(buildDocumentChecklist(claimType as ClaimType));
  }, [claimType]);

  const allowedClaimTypes = selectedPolicy
    ? (POLICY_TYPE_CLAIM_MAP[selectedPolicy.type] || [])
    : [];

  const requiredDocsTotal = documents.filter((d) => d.required).length;
  const receivedRequired = documents.filter((d) => d.required && d.received).length;
  const missingRequired = requiredDocsTotal - receivedRequired;

  const toggleDocReceived = (idx: number) => {
    setDocuments((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], received: !next[idx].received };
      return next;
    });
  };

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        policyId: selectedPolicy._id,
        clientId: selectedClient._id,
        claimType,
        incidentDate,
        description,
        estimatedAmount: Math.round(parseFloat(estimatedAmount) * 100),
        hospitalName: hospitalName || undefined,
        garageName: garageName || undefined,
        doctorName: doctorName || undefined,
        insurerClaimNumber: insurerClaimNumber || undefined,
        forceCreate,
      };

      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.error === "duplicate_claim") {
        setDuplicateWarning(data.message);
        setSubmitting(false);
        return;
      }

      if (data.success) {
        toast.success(`Claim ${data.claim.claimNumber} filed successfully`);
        router.push(`/claims/${data.claim._id}`);
      } else {
        toast.error(data.error || "Failed to file claim");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
              ${i < step ? "bg-primary border-primary text-white" : i === step ? "border-primary text-primary" : "border-gray-300 text-gray-400"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:block ${i === step ? "text-primary" : "text-gray-400"}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? "bg-primary" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h2 className="text-lg font-semibold">Step 1 — Claim Details</h2>

          {/* Client search */}
          <div>
            <label className="block text-sm font-medium mb-1">Client *</label>
            <input
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Type client name to search..."
              value={selectedClient ? selectedClient.fullName : clientSearch}
              onChange={(e) => { setClientSearch(e.target.value); setSelectedClient(null); }}
            />
            {clients.length > 0 && !selectedClient && (
              <div className="mt-1 border rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => { setSelectedClient(c); setClients([]); setClientSearch(""); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    {c.fullName} — {c.mobile}
                    {c.isDeceased && <span className="ml-2 text-red-500 text-xs font-medium">(Deceased)</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Policy dropdown */}
          {selectedClient && (
            <div>
              <label className="block text-sm font-medium mb-1">Policy *</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none"
                value={selectedPolicy?._id || ""}
                onChange={(e) => {
                  const p = policies.find((p) => p._id === e.target.value);
                  setSelectedPolicy(p || null);
                  setClaimType("");
                }}
              >
                <option value="">Select policy...</option>
                {policies.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.policyNumber} — {p.type} — {p.insurerId?.name}
                    {p.status === "lapsed" ? " ⚠️ LAPSED" : ""}
                  </option>
                ))}
              </select>
              {selectedPolicy?.status === "lapsed" && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                  ⚠️ This policy is currently lapsed. The insurer may reject this claim.
                </div>
              )}
            </div>
          )}

          {/* Claim type */}
          {selectedPolicy && (
            <div>
              <label className="block text-sm font-medium mb-1">Claim Type *</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none"
                value={claimType}
                onChange={(e) => setClaimType(e.target.value as ClaimType)}
              >
                <option value="">Select type...</option>
                {allowedClaimTypes.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ").toUpperCase()}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Insurer Claim Ref. No. (optional)</label>
            <input
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none"
              placeholder="If you've already filed with insurer..."
              value={insurerClaimNumber}
              onChange={(e) => setInsurerClaimNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of Incident *</label>
            <input
              type="date"
              max={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description * (min 20 characters)</label>
            <textarea
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none resize-none"
              rows={4}
              maxLength={2000}
              placeholder="Describe the incident in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">{description.length}/2000</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estimated Claim Amount (₹) *</label>
            <input
              type="number"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none"
              placeholder="0.00"
              value={estimatedAmount}
              onChange={(e) => setEstimatedAmount(e.target.value)}
            />
          </div>

          {(claimType === "health" || claimType === "accident") && (
            <div>
              <label className="block text-sm font-medium mb-1">Hospital Name</label>
              <input className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
            </div>
          )}

          {claimType === "health" && (
            <div>
              <label className="block text-sm font-medium mb-1">Doctor Name</label>
              <input className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
            </div>
          )}

          {claimType === "vehicle" && (
            <div>
              <label className="block text-sm font-medium mb-1">Garage Name</label>
              <input className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none" value={garageName} onChange={(e) => setGarageName(e.target.value)} />
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            disabled={!selectedClient || !selectedPolicy || !claimType || !incidentDate || description.length < 20 || !estimatedAmount}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            Next: Documents →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h2 className="text-lg font-semibold">Step 2 — Document Checklist</h2>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Required documents</span>
              <span className={`font-medium ${missingRequired > 0 ? "text-amber-600" : "text-green-600"}`}>
                {receivedRequired}/{requiredDocsTotal}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className={`h-2 rounded-full transition-all ${missingRequired === 0 ? "bg-green-500" : "bg-amber-500"}`}
                style={{ width: `${requiredDocsTotal > 0 ? (receivedRequired / requiredDocsTotal) * 100 : 0}%` }}
              />
            </div>
          </div>

          {missingRequired > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
              ⚠️ {missingRequired} required document{missingRequired > 1 ? "s" : ""} missing. You can continue and upload later, but the claim cannot be submitted to insurer without them.
            </div>
          )}

          <div className="space-y-3">
            {documents.map((doc, idx) => (
              <div key={doc.docType} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  id={`doc-${idx}`}
                  checked={doc.received}
                  onChange={() => toggleDocReceived(idx)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor={`doc-${idx}`} className="text-sm font-medium cursor-pointer">
                    {doc.label}
                    {doc.required && <span className="ml-2 text-xs text-red-500 font-medium">Required</span>}
                  </label>
                </div>
                <div className="text-xs text-gray-400">{doc.received ? "✓ Received" : "Pending"}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 border border-gray-300 dark:border-gray-600 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              ← Back
            </button>
            <button onClick={() => setStep(2)} className="flex-1 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Next: Review →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h2 className="text-lg font-semibold">Step 3 — Review & Submit</h2>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-gray-500 text-xs mb-1">Client</div>
                <div className="font-medium">{selectedClient?.fullName}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-gray-500 text-xs mb-1">Policy</div>
                <div className="font-medium font-mono">{selectedPolicy?.policyNumber}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-gray-500 text-xs mb-1">Claim Type</div>
                <div className="font-medium capitalize">{claimType?.replace("_", " ")}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-gray-500 text-xs mb-1">Estimated Amount</div>
                <div className="font-medium">₹{parseInt(estimatedAmount || "0").toLocaleString("en-IN")}</div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-gray-500 text-xs mb-1">Documents</div>
              <div className="font-medium">{receivedRequired}/{requiredDocsTotal} required received ({documents.filter(d => d.received).length}/{documents.length} total)</div>
            </div>

            {claimType && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 text-xs">
                ℹ️ Estimated processing time for {claimType.replace("_", " ")} claims: {CLAIM_PROCESSING_ESTIMATES[claimType as ClaimType]}
              </div>
            )}
          </div>

          {/* Duplicate warning */}
          {duplicateWarning && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg space-y-3">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">{duplicateWarning}</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={forceCreate} onChange={(e) => setForceCreate(e.target.checked)} />
                <span className="text-sm text-red-700 dark:text-red-400">I understand — create a separate claim anyway</span>
              </label>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 dark:border-gray-600 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (!!duplicateWarning && !forceCreate)}
              className="flex-1 bg-primary text-white py-2.5 rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {submitting ? "Filing..." : "Submit Claim"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
