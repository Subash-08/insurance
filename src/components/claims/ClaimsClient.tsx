"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

const URGENCY_COLORS: Record<string, string> = {
  urgent: "text-red-600 bg-red-50 dark:bg-red-900/20",
  attention: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  normal: "text-green-600 bg-green-50 dark:bg-green-900/20",
};

export default function ClaimsClient() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const fetchClaims = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));

      const res = await fetch(`/api/claims?${params}`);
      const data = await res.json();
      if (data.success) {
        setClaims(data.data);
        setPagination(data.pagination);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => fetchClaims(1), 300);
    return () => clearTimeout(t);
  }, [fetchClaims]);

  const urgencyBadge = (c: any) => {
    const level = c.daysPending > 30 || c.status === "additional_info_required"
      ? "urgent" : c.daysPending > 15 ? "attention" : "normal";
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${URGENCY_COLORS[level]}`}>
        <Clock className="w-3 h-3" />
        {c.daysPending !== null ? `${c.daysPending}d` : "Closed"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Claims</h1>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm font-semibold">
              {pagination.total}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Track and manage insurance claims</p>
        </div>
        <Link
          href="/claims/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> File New Claim
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search claim or insurer ref no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="filed">Filed</option>
          <option value="documents_submitted">Documents Submitted</option>
          <option value="under_insurer_review">Under Review</option>
          <option value="additional_info_required">Info Required</option>
          <option value="approved">Approved</option>
          <option value="settlement_received">Settlement Received</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="death">Death</option>
          <option value="maturity">Maturity</option>
          <option value="health">Health</option>
          <option value="accident">Accident</option>
          <option value="vehicle">Vehicle</option>
          <option value="fire">Fire</option>
          <option value="travel">Travel</option>
          <option value="critical_illness">Critical Illness</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading claims...</div>
        ) : claims.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-lg font-medium">No claims found</p>
            <Link href="/claims/new" className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus size={14} /> File First Claim
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Claim</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client & Policy</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {claims.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => (window.location.href = `/claims/${c._id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{c.claimNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{c.clientId?.fullName}</p>
                      <p className="text-xs text-gray-500 font-mono">{c.policyId?.policyNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {c.claimType?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} type="claim" />
                    </td>
                    <td className="px-4 py-3">{urgencyBadge(c)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/claims/${c._id}`} className="text-xs text-primary hover:underline font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Showing {claims.length} of {pagination.total} claims</span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchClaims(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >Previous</button>
            <button
              onClick={() => fetchClaims(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
