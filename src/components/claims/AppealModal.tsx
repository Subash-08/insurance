"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, AlertTriangle } from "lucide-react";

interface Props {
  claimId: string;
  claimNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppealModal({ claimId, claimNumber, onClose, onSuccess }: Props) {
  const [appealReason, setAppealReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const charCount = appealReason.length;
  const isValid = charCount >= 50;

  const handleSubmit = async () => {
    if (!isValid) { toast.error("Appeal reason must be at least 50 characters"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appealReason, notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Appeal filed — claim re-opened");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to file appeal");
      }
    } catch { toast.error("Error filing appeal"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">File Appeal</h2>
            <p className="text-sm text-gray-500">{claimNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1">
            <X size={20} />
          </button>
        </div>

        {/* Warning */}
        <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Filing an appeal does not guarantee reconsideration. Ensure you have strong supporting documentation.
          </p>
        </div>

        {/* Appeal reason */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Appeal Reason * <span className="text-gray-400 font-normal">(min 50 characters)</span>
          </label>
          <textarea
            rows={5}
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            placeholder="Provide a detailed reason for the appeal, including any new evidence or arguments..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className={`text-xs mt-1 ${isValid ? "text-green-600" : "text-gray-400"}`}>
            {charCount}/50 minimum {isValid && "✓"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Additional Notes (optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 resize-none focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-600 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !isValid}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
          >
            {submitting ? "Filing..." : "File Appeal"}
          </button>
        </div>
      </div>
    </div>
  );
}
