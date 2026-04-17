"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function RecordPaymentModal({ isOpen, onClose, premium, onSuccess }: any) {
  const [amount, setAmount] = useState((premium?.balanceAmount ?? premium?.amount ?? 0) / 100);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [mode, setMode] = useState("cash");
  const [bankName, setBankName] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (premium) {
      setAmount((premium.balanceAmount || premium.amount || 0) / 100);
    }
  }, [premium]);

  const resetState = () => {
    setAmount((premium?.balanceAmount || premium?.amount || 0) / 100);
    setDate(new Date().toISOString().split("T")[0]);
    setMode("cash");
    setBankName("");
    setChequeNumber("");
    setUtrNumber("");
    setNotes("");
    setError("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const idempotencyKey = `PAY-${premium._id}-${Date.now()}`;
      
      const payload = {
        amount: Math.round(Number(amount) * 100),
        date: new Date(date).toISOString(),
        mode,
        bankName: bankName || undefined,
        chequeNumber: chequeNumber || undefined,
        utrNumber: utrNumber || undefined,
        notes: notes || undefined,
        idempotencyKey,
      };

      const res = await fetch(`/api/premiums/${premium._id}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onSuccess();
        resetState();
      } else {
        setError(json.error || "Failed to record payment");
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Record Payment</h2>
          <button onClick={handleClose} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Amount (₹)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))} 
              className="col-span-3 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="col-span-3 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Mode</label>
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value)}
              className="col-span-3 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
              <option value="neft">NEFT</option>
              <option value="rtgs">RTGS</option>
              <option value="online">Online</option>
              <option value="ecs">ECS</option>
              <option value="nach">NACH</option>
            </select>
          </div>
          
          {(mode === "cheque" || mode === "neft" || mode === "rtgs" || mode === "ecs" || mode === "nach") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
              <input 
                value={bankName} 
                onChange={(e) => setBankName(e.target.value)} 
                className="col-span-3 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50" 
              />
            </div>
          )}

          {mode === "cheque" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Cheque No</label>
              <input 
                value={chequeNumber} 
                onChange={(e) => setChequeNumber(e.target.value)} 
                className="col-span-3 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50" 
              />
            </div>
          )}

          {(mode === "upi" || mode === "neft" || mode === "rtgs" || mode === "online") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">Ref / UTR</label>
              <input 
                value={utrNumber} 
                onChange={(e) => setUtrNumber(e.target.value)} 
                className="col-span-3 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50" 
              />
            </div>
          )}

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
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? "Saving..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
