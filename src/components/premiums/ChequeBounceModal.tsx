"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function ChequeBounceModal({ isOpen, onClose, premium, onSuccess }: any) {
  const [paymentHistoryId, setPaymentHistoryId] = useState("");
  const [bounceReason, setBounceReason] = useState("");
  const [bankCharges, setBankCharges] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validPayments = premium?.paymentHistory?.filter((tx: any) => tx.mode === "cheque" && !tx.isBounced) || [];

  const handleClose = () => {
    setPaymentHistoryId("");
    setBounceReason("");
    setBankCharges(0);
    setNotes("");
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!paymentHistoryId) {
      setError("Please select a transaction");
      return;
    }
    if (!bounceReason) {
      setError("Bounce reason is required");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const payload = {
        paymentHistoryId,
        bounceReason,
        bankCharges: bankCharges ? Math.round(Number(bankCharges) * 100) : undefined,
        notes: notes || undefined,
      };

      const res = await fetch(`/api/premiums/${premium._id}/bounce`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onSuccess();
        handleClose();
      } else {
        setError(json.error || "Failed to record bounce");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Record Cheque Bounce</h2>
          <button onClick={handleClose} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Transaction</label>
            <div className="col-span-3">
              <select 
                value={paymentHistoryId} 
                onChange={(e) => setPaymentHistoryId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="" disabled>Select cheque payment</option>
                {validPayments.map((tx: any) => (
                  <option key={tx._id} value={tx._id}>
                    {tx.chequeNumber || 'Unknown Chq'} (₹{tx.amount / 100})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
            <input 
              value={bounceReason} 
              onChange={(e) => setBounceReason(e.target.value)} 
              placeholder="e.g. Insufficient Funds"
              className="col-span-3 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Bank Charges</label>
            <input 
              type="number" 
              value={bankCharges} 
              onChange={(e) => setBankCharges(Number(e.target.value))} 
              className="col-span-3 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="col-span-3 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" 
              rows={3}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2">
          <button 
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-white dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition"
          >
            {loading ? "Saving..." : "Record Bounce"}
          </button>
        </div>
      </div>
    </div>
  );
}
