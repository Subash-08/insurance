"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  claimId: string;
  claimType: string;
  estimatedAmount: number;
  settlement?: any;
  isEditable: boolean;
  onSettled?: () => void;
}

export default function SettlementForm({ claimId, claimType, estimatedAmount, settlement, isEditable, onSettled }: Props) {
  const [form, setForm] = useState({
    settlementAmount: settlement?.settlementAmount ? String(settlement.settlementAmount / 100) : "",
    tdsDeducted: settlement?.tdsDeducted ? String(settlement.tdsDeducted / 100) : "0",
    settlementDate: settlement?.settlementDate ? new Date(settlement.settlementDate).toISOString().split("T")[0] : "",
    paymentMode: settlement?.paymentMode || "neft",
    bankAccount: settlement?.bankAccount || "",
    ifscCode: settlement?.ifscCode || "",
    accountHolderName: settlement?.accountHolderName || "",
    settlementLetterUrl: settlement?.settlementLetterUrl || "",
    notes: settlement?.notes || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const tds = parseFloat(form.tdsDeducted) || 0;
  const gross = parseFloat(form.settlementAmount) || 0;
  const netPayout = gross - tds;
  const isPartial = gross > 0 && gross < estimatedAmount / 100;

  const set = (field: string, val: string) => setForm((p) => ({ ...p, [field]: val }));

  const handleSubmit = async () => {
    if (!form.settlementAmount || !form.settlementDate || !form.paymentMode) {
      toast.error("Fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/settlement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementAmount: Math.round(gross * 100),
          tdsDeducted: Math.round(tds * 100),
          settlementDate: form.settlementDate,
          paymentMode: form.paymentMode,
          bankAccount: form.bankAccount,
          ifscCode: form.ifscCode,
          accountHolderName: form.accountHolderName,
          settlementLetterUrl: form.settlementLetterUrl,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.isPartial ? "Partial settlement recorded. Close the claim manually when complete." : "Settlement recorded successfully");
        onSettled?.();
      } else {
        toast.error(data.error || "Failed to record settlement");
      }
    } catch { toast.error("Error submitting settlement"); }
    finally { setSubmitting(false); }
  };

  if (!isEditable && !settlement) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        Settlement can be recorded once the claim is in <strong>Approved</strong> status.
      </div>
    );
  }

  if (!isEditable && settlement) {
    return (
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Settlement Amount", `₹${(settlement.settlementAmount / 100).toLocaleString("en-IN")}`],
            ["TDS Deducted", `₹${(settlement.tdsDeducted / 100).toLocaleString("en-IN")}`],
            ["Net Payout", `₹${(settlement.netPayout / 100).toLocaleString("en-IN")}`],
            ["Payment Mode", settlement.paymentMode?.toUpperCase()],
            ["Bank Account (last 4)", settlement.bankAccount],
            ["IFSC Code", settlement.ifscCode],
            ["Settlement Date", settlement.settlementDate ? new Date(settlement.settlementDate).toLocaleDateString("en-IN") : "—"],
          ].map(([label, value]) => (
            <div key={label} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="font-semibold">{value || "—"}</div>
            </div>
          ))}
        </div>
        {settlement.isPartial && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
            ⚠️ This is a <strong>partial settlement</strong>. The claim remains open until manually closed.
          </div>
        )}
        {settlement.settlementLetterUrl && (
          <a href={settlement.settlementLetterUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">View Settlement Letter ↗</a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Settlement Amount (₹) *</label>
          <input type="number" value={form.settlementAmount} onChange={(e) => set("settlementAmount", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        {claimType === "maturity" && (
          <div>
            <label className="block text-sm font-medium mb-1">TDS Deducted (₹)</label>
            <input type="number" value={form.tdsDeducted} onChange={(e) => set("tdsDeducted", e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none" />
          </div>
        )}
      </div>

      {gross > 0 && (
        <div className={`p-3 rounded-lg text-sm flex items-center justify-between ${isPartial ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400" : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"}`}>
          <span>{isPartial ? "⚠️ Partial settlement (below estimated)" : "✓ Full settlement"}</span>
          <span className="font-semibold">Net Payout: ₹{netPayout.toLocaleString("en-IN")}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Settlement Date *</label>
          <input type="date" value={form.settlementDate} onChange={(e) => set("settlementDate", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Mode *</label>
          <select value={form.paymentMode} onChange={(e) => set("paymentMode", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none">
            <option value="neft">NEFT</option>
            <option value="rtgs">RTGS</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bank Account (last 4 digits)</label>
          <input maxLength={4} value={form.bankAccount} onChange={(e) => set("bankAccount", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">IFSC Code</label>
          <input value={form.ifscCode} onChange={(e) => set("ifscCode", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Account Holder Name</label>
        <input value={form.accountHolderName} onChange={(e) => set("accountHolderName", e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 resize-none focus:outline-none" />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-primary text-white py-2.5 rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        {submitting ? "Saving..." : "Record Settlement"}
      </button>
    </div>
  );
}
