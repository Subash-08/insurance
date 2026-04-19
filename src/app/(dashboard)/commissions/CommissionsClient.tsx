"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { IndianRupee, CheckCircle2, Clock, CheckSquare, Search, Filter } from "lucide-react";

export default function CommissionsClient() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchCommissions = async () => {
    try {
      const res = await fetch("/api/commissions");
      const data = await res.json();
      if (data.success) {
        setCommissions(data.data);
      }
    } catch {
      toast.error("Failed to fetch commissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pendingIds = commissions.filter(c => c.status === "pending").map(c => c._id);
      setSelectedIds(new Set(pendingIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkMarkPaid = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Mark ${selectedIds.size} commissions as reconciled?`)) return;

    try {
      const res = await fetch("/api/commissions/bulk-mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionIds: Array.from(selectedIds) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Marked ${data.modifiedCount} commissions as paid`);
        setSelectedIds(new Set());
        fetchCommissions();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Reconciliation failed");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading commission ledger...</div>;

  const totalSelectedValue = commissions
    .filter(c => selectedIds.has(c._id))
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-border shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
             <IndianRupee className="mr-2 text-primary" size={28} /> Revenue Reconciliation
           </h1>
           <p className="text-sm text-gray-500 mt-1">Manage brokerages and reconcile payments with insurers.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {selectedIds.size > 0 && (
             <button
               onClick={handleBulkMarkPaid}
               className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition shadow-lg shadow-green-600/20 animate-in slide-in-from-right"
             >
               <CheckSquare size={16} className="mr-2" />
               Reconcile ₹{(totalSelectedValue / 100).toLocaleString("en-IN")}
             </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search by policy or client..." className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary" />
           </div>
           <button className="flex items-center px-3 py-2 border border-border rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
             <Filter size={16} className="mr-2" /> Filter List
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-border text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <input type="checkbox" onChange={handleSelectAll} className="rounded border-gray-300 text-primary w-4 h-4 cursor-pointer focus:ring-primary" />
                </th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Policy / Plan</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Billed Premium</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Commission</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {commissions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No commissions recorded yet.</td></tr>
              ) : (
                commissions.map(c => (
                  <tr key={c._id} className={selectedIds.has(c._id) ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/30"}>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        disabled={c.status === "paid"}
                        checked={selectedIds.has(c._id)}
                        onChange={() => handleSelect(c._id)}
                        className={`w-4 h-4 rounded cursor-pointer focus:ring-primary ${c.status === "paid" ? "text-gray-300 border-gray-300 cursor-not-allowed" : "text-primary border-gray-300"}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">{c.month}</td>
                    <td className="px-4 py-3">
                       <div className="font-semibold text-primary">{c.policyId?.policyNumber || "N/A"}</div>
                       <div className="text-xs text-gray-500">{c.policyId?.planName || "N/A"} • {c.policyType}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{c.clientId?.fullName || "Unlinked"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">₹{(c.paidAmount / 100).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right text-gray-500 font-medium">{c.commissionRate}%</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">₹{(c.commissionAmount / 100).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-center">
                       {c.status === "paid" ? (
                         <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-semibold dark:bg-green-900/30 dark:text-green-500 dark:border-green-800">
                           <CheckCircle2 size={12} className="mr-1" /> Paid
                         </span>
                       ) : (
                         <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold dark:bg-amber-900/30 dark:text-amber-500 dark:border-amber-800">
                           <Clock size={12} className="mr-1" /> Pending
                         </span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
