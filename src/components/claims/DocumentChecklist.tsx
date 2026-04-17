"use client";

import { useState } from "react";
import { toast } from "sonner";

interface DocItem {
  _id: string;
  docType: string;
  label: string;
  required: boolean;
  received: boolean;
  receivedAt?: string;
  fileUrl?: string;
  notes?: string;
}

interface Props {
  claimId: string;
  documents: DocItem[];
  editable?: boolean;
  onUpdated?: () => void;
}

export default function DocumentChecklist({ claimId, documents, editable = false, onUpdated }: Props) {
  const [saving, setSaving] = useState<string | null>(null);

  const requiredTotal = documents.filter((d) => d.required).length;
  const requiredReceived = documents.filter((d) => d.required && d.received).length;
  const pct = requiredTotal > 0 ? Math.round((requiredReceived / requiredTotal) * 100) : 0;

  const toggleReceived = async (doc: DocItem) => {
    setSaving(doc._id);
    try {
      const res = await fetch(`/api/claims/${claimId}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc._id, received: !doc.received }),
      });
      const data = await res.json();
      if (data.success) { onUpdated?.(); toast.success("Document updated"); }
      else toast.error(data.error || "Failed to update");
    } catch { toast.error("Error updating document"); }
    finally { setSaving(null); }
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Required documents received</span>
          <span className={`font-semibold ${pct === 100 ? "text-green-600" : "text-amber-600"}`}>
            {requiredReceived}/{requiredTotal} ({pct}%)
          </span>
        </div>
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-amber-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {requiredReceived < requiredTotal && (
        <div className="p-3 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400">
          ⚠️ {requiredTotal - requiredReceived} required document{requiredTotal - requiredReceived !== 1 ? "s" : ""} still needed before submitting to insurer.
        </div>
      )}

      {/* Document list */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc._id} className={`p-4 border rounded-lg transition-colors ${doc.received ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700"}`}>
            <div className="flex items-start gap-3">
              {editable ? (
                <input
                  type="checkbox"
                  checked={doc.received}
                  disabled={saving === doc._id}
                  onChange={() => toggleReceived(doc)}
                  className="mt-1 cursor-pointer"
                />
              ) : (
                <div className={`mt-1 w-4 h-4 rounded flex items-center justify-center text-xs ${doc.received ? "bg-green-500 text-white" : "border border-gray-300"}`}>
                  {doc.received ? "✓" : ""}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{doc.label}</span>
                  {doc.required && (
                    <span className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">Required</span>
                  )}
                  {doc.received && !doc.fileUrl && (
                    <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Received — not uploaded</span>
                  )}
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium">View ↗</a>
                  )}
                </div>
                {doc.receivedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Received on {new Date(doc.receivedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                )}
              </div>
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${doc.received ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                {saving === doc._id ? "Saving..." : doc.received ? "✓ Received" : "Pending"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
