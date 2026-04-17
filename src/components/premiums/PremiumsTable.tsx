"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import RecordPaymentModal from "./RecordPaymentModal";
import ChequeBounceModal from "./ChequeBounceModal";

export default function PremiumsTable({ onActionCompleted }: { onActionCompleted?: () => void }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("unpaid");
  const [search, setSearch] = useState("");
  
  const [selectedPremium, setSelectedPremium] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBounceModalOpen, setIsBounceModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/premiums?status=${statusFilter}&search=${search}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, search]);

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    fetchData();
    if (onActionCompleted) onActionCompleted();
  };

  const handleBounceSuccess = () => {
    setIsBounceModalOpen(false);
    fetchData();
    if (onActionCompleted) onActionCompleted();
  };

  const downloadReceipt = async (premiumId: string) => {
    window.open(`/api/premiums/${premiumId}/receipt`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <input 
          placeholder="Search policy or client..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full max-w-sm pl-3 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" 
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-[180px] border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Premiums</option>
          <option value="unpaid">Due / Upcoming</option>
          <option value="due">Due Only</option>
          <option value="overdue">Overdue Only</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Client & Policy</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading premiums...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No premiums found</td></tr>
              ) : (
                data.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <div>{p.clientId.name}</div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{p.policyId.policyNumber}</div>
                      <div className="text-xs text-gray-500">{p.policyId.insurerId?.name}</div>
                    </td>
                    <td className="px-4 py-3">{formatDate(p.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{formatCurrency(p.amount / 100)}</span>
                      {p.balanceAmount > 0 && p.balanceAmount !== p.amount && (
                        <div className="text-xs text-orange-600 font-medium mt-1">
                          Bal: {formatCurrency(p.balanceAmount / 100)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} type="premium" /></td>
                    <td className="px-4 py-3 text-right space-x-2">
                       {/* Explicit logic since standard component replaced StatusBadge mapping */}
                      {p.status !== "paid" && p.status !== "cancelled" && (
                        <button 
                          className="px-3 py-1.5 border border-indigo-200 text-indigo-600 bg-white dark:bg-gray-800 dark:border-indigo-800 dark:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-medium text-xs transition"
                          onClick={() => { setSelectedPremium(p); setIsPaymentModalOpen(true); }}
                        >
                          Pay
                        </button>
                      )}
                      {(p.status === "paid" || p.status === "partially_paid") && (
                        <button 
                          className="px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 font-medium text-xs transition"
                          onClick={() => downloadReceipt(p._id)}
                        >
                          Receipt
                        </button>
                      )}
                      {p.paymentHistory && p.paymentHistory.length > 0 && p.paymentHistory.some((tx: any) => tx.mode === "cheque" && !tx.isBounced) && (
                        <button 
                          className="px-3 py-1.5 border border-red-200 text-red-600 bg-white dark:bg-gray-800 dark:border-red-800 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 font-medium text-xs transition mt-1 sm:mt-0"
                          onClick={() => { setSelectedPremium(p); setIsBounceModalOpen(true); }}
                        >
                          Bounce
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPremium && isPaymentModalOpen && (
        <RecordPaymentModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)} 
          premium={selectedPremium} 
          onSuccess={handlePaymentSuccess} 
        />
      )}

      {selectedPremium && isBounceModalOpen && (
        <ChequeBounceModal 
          isOpen={isBounceModalOpen} 
          onClose={() => setIsBounceModalOpen(false)} 
          premium={selectedPremium} 
          onSuccess={handleBounceSuccess} 
        />
      )}
    </div>
  );
}
