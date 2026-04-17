"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, AlertCircle, CheckCircle, ChevronDown, FileText } from "lucide-react";
import ClaimStatusStepper from "./ClaimStatusStepper";
import ClaimTimeline from "./ClaimTimeline";
import DocumentChecklist from "./DocumentChecklist";
import SettlementForm from "./SettlementForm";
import AppealModal from "./AppealModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { VALID_STATUS_TRANSITIONS, ClaimStatus } from "@/lib/claims-helpers";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const URGENCY_STYLES: Record<string, string> = {
  urgent: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  attention: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  normal: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
};

interface Props {
  claimId: string;
  userRole: string;
  userId: string;
}

export default function ClaimDetailClient({ claimId, userRole, userId }: Props) {
  const router = useRouter();
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "documents" | "timeline" | "settlement">("overview");
  const [showAppeal, setShowAppeal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [showStatusPanel, setShowStatusPanel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}`);
      const data = await res.json();
      if (data.success) setClaim(data.claim);
      else toast.error("Failed to load claim");
    } catch { toast.error("Error loading claim"); }
    finally { setLoading(false); }
  }, [claimId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async () => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, notes: statusNote }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to "${newStatus.replace(/_/g, " ")}"`);
        setShowStatusPanel(false);
        setNewStatus(""); setStatusNote("");
        load();
      } else { toast.error(data.error); }
    } catch { toast.error("Error updating status"); }
    finally { setUpdatingStatus(false); }
  };

  const deleteClaim = async () => {
    if (!confirm("Soft-delete this claim? It will be marked as closed.")) return;
    const res = await fetch(`/api/claims/${claimId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Claim closed"); router.push("/claims"); }
    else toast.error(data.error);
  };

  if (loading) return <div className="py-20 text-center text-sm text-gray-400 animate-pulse">Loading claim...</div>;
  if (!claim) return <div className="py-20 text-center text-red-500">Claim not found.</div>;

  const urgencyLevel = claim.daysPending > 30 || claim.status === "additional_info_required"
    ? "urgent" : claim.daysPending > 15 ? "attention" : "normal";

  const validNextStatuses = (VALID_STATUS_TRANSITIONS[claim.status as ClaimStatus] || []);
  const client = claim.clientId;
  const policy = claim.policyId;
  const agent = claim.agentId;
  const insurer = policy?.insurerId;

  // Build WhatsApp URL for claim update
  const waUrl = buildWhatsAppUrl("claim_update", {
    clientName: client?.fullName || "",
    claimNumber: claim.claimNumber || "",
    claimStatus: claim.status?.replace(/_/g, " ") || "",
    daysPending: String(claim.daysPending ?? 0),
    agentName: agent?.name || "",
    agentPhone: agent?.mobile || "",
  }, client?.mobile || "");

  const timelineEvents = (claim.statusHistory || []).map((h: any) => ({
    type: "status" as const,
    description: `Status changed to "${h.status.replace(/_/g, " ")}"`,
    notes: h.notes,
    changedBy: h.changedBy,
    changedAt: h.changedAt,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{claim.claimNumber}</h1>
              <StatusBadge status={claim.status} type="claim" />
              {claim.isLapsedPolicyWarning && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">⚠️ Lapsed Policy</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>{client?.fullName}</span>
              <span className="text-gray-300">·</span>
              <span className="font-mono">{policy?.policyNumber}</span>
              <span className="text-gray-300">·</span>
              <span className="capitalize">{claim.claimType?.replace("_", " ")}</span>
            </div>
          </div>

          {/* Days pending badge */}
          {claim.daysPending !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${URGENCY_STYLES[urgencyLevel]}`}>
              <Clock size={16} />
              {claim.daysPending} day{claim.daysPending !== 1 ? "s" : ""} pending
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setShowStatusPanel(!showStatusPanel)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Update Status <ChevronDown size={14} />
          </button>
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.524 5.849L0 24l6.278-1.499A11.964 11.964 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.88 0-3.637-.497-5.152-1.367l-.370-.219-3.727.89.937-3.595-.240-.37A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              WhatsApp Update
            </a>
          )}
          {claim.status === "rejected" && (
            <button onClick={() => setShowAppeal(true)} className="px-3 py-2 text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100">
              File Appeal
            </button>
          )}
          {userRole === "owner" && (
            <button onClick={deleteClaim} className="ml-auto px-3 py-2 text-sm font-medium text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              Delete Claim
            </button>
          )}
        </div>

        {/* Status update panel */}
        {showStatusPanel && validNextStatuses.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Move to next stage</h3>
            <div className="flex gap-2 flex-wrap">
              {validNextStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${newStatus === s ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"}`}
                >
                  {s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
            <textarea rows={2} value={statusNote} onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Add a note (optional)..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 resize-none focus:outline-none"
            />
            <button onClick={updateStatus} disabled={!newStatus || updatingStatus}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {updatingStatus ? "Updating..." : "Confirm Update"}
            </button>
          </div>
        )}
      </div>

      {/* Status stepper */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <ClaimStatusStepper currentStatus={claim.status} statusHistory={claim.statusHistory || []} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — tabbed content */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {(["overview", "documents", "timeline", "settlement"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="p-5">
            {tab === "overview" && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Claim Type", claim.claimType?.replace(/_/g, " ").toUpperCase()],
                    ["Incident Date", formatDate(claim.incidentDate)],
                    ["Estimated Amount", formatCurrency(claim.estimatedAmount)],
                    ["Insurer Ref.", claim.insurerClaimNumber || "Not provided"],
                    ["Hospital", claim.hospitalName || "—"],
                    ["Garage", claim.garageName || "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">{label}</div>
                      <div className="font-medium capitalize">{value || "—"}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Description</div>
                  <p className="text-sm leading-relaxed">{claim.description}</p>
                </div>
              </div>
            )}
            {tab === "documents" && (
              <DocumentChecklist claimId={claimId} documents={claim.documents || []} editable={true} onUpdated={load} />
            )}
            {tab === "timeline" && (
              <ClaimTimeline claimId={claimId} events={timelineEvents} onEventAdded={load} />
            )}
            {tab === "settlement" && (
              <SettlementForm
                claimId={claimId}
                claimType={claim.claimType}
                estimatedAmount={claim.estimatedAmount}
                settlement={claim.settlement}
                isEditable={claim.status === "approved"}
                onSettled={load}
              />
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Client & Policy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Client & Policy</h3>
            <div className="text-sm space-y-1.5">
              <div>
                <span className="text-gray-400 text-xs">Client</span>
                <p className="font-medium">{client?.fullName}</p>
                <p className="text-gray-500">{client?.mobile}</p>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                <span className="text-gray-400 text-xs">Policy</span>
                <Link href={`/policies/${policy?._id}`} className="block font-mono text-primary hover:underline">{policy?.policyNumber}</Link>
                <p className="text-gray-500 capitalize">{policy?.type} · {insurer?.name}</p>
              </div>
              {claim.appeals?.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                  <span className="text-gray-400 text-xs">Appeals Filed</span>
                  <p className="font-semibold">{claim.appeals.length}</p>
                </div>
              )}
            </div>
          </div>

          {/* Insurer contact */}
          {insurer && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Insurer</h3>
              <p className="text-sm font-medium">{insurer.name}</p>
              {insurer.claimEmail && <p className="text-xs text-gray-500">{insurer.claimEmail}</p>}
              {insurer.claimPhone && <p className="text-xs text-gray-500">{insurer.claimPhone}</p>}
            </div>
          )}
        </div>
      </div>

      {showAppeal && (
        <AppealModal
          claimId={claimId}
          claimNumber={claim.claimNumber}
          onClose={() => setShowAppeal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
