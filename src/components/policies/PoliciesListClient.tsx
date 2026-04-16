'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { AgentLabel } from '@/components/shared/HealthScoreBadge';

export default function PoliciesListClient({ userRole, userId }: { userRole: string; userId: string }) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const fetchPolicies = useCallback(async (searchTerm: string, status: string, type: string, pageNum: number) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (searchTerm) p.set('search', searchTerm);
      if (status) p.set('status', status);
      if (type) p.set('type', type);
      p.set('page', pageNum.toString());

      const res = await fetch(`/api/policies?${p}`);
      const data = await res.json();
      if (data.success) {
        setPolicies(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchPolicies(search, statusFilter, typeFilter, 1);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search, statusFilter, typeFilter, fetchPolicies]);

  useEffect(() => {
    fetchPolicies(search, statusFilter, typeFilter, page);
  }, [page]); // eslint-disable-line

  const hasFilters = search || statusFilter || typeFilter;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Policies</h1>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm font-semibold">
              {pagination.total}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Manage and track your agency's policies</p>
        </div>
        <Link
          href="/policies/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Add Policy
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search policy number, client, insurer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="life">Life</option>
          <option value="health">Health</option>
          <option value="vehicle">Vehicle</option>
          <option value="ulip">ULIP</option>
          <option value="term">Term</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="lapsed">Lapsed</option>
          <option value="matured">Matured</option>
          <option value="surrendered">Surrendered</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-lg font-medium">No policies found</p>
            {!hasFilters && (
              <Link href="/policies/new" className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus size={14} /> Issue First Policy
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client & Policy</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Insurer & Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Premium</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Next Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  {userRole === 'owner' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent</th>}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {policies.map(p => (
                  <tr key={p._id} onClick={() => window.location.href = `/policies/${p._id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]" title={p.clientId?.fullName}>{p.clientId?.fullName}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{p.policyNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.insurerId?.logoUrl ? (
                          <img src={p.insurerId?.logoUrl} alt={p.insurerId?.name} className="w-6 h-6 rounded object-contain bg-white border" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            {p.insurerId?.name?.slice(0, 2)}
                          </div>
                        )}
                        <div className="truncate max-w-[150px]">
                          <p className="font-medium text-gray-900 dark:text-gray-200 truncate" title={p.planName}>{p.planName}</p>
                          <p className="text-[10px] uppercase text-gray-500 tracking-wider flex items-center gap-1">
                            {p.type} <span className="w-1 h-1 rounded-full bg-gray-300"></span> {p.paymentFrequency}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-200">
                        <CurrencyDisplay paise={p.totalPremium} />
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        SA: <CurrencyDisplay paise={p.sumAssured} compact />
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {p.nextPremiumDue ? (
                        <div>
                          <p className={`font-medium ${new Date(p.nextPremiumDue) < new Date() ? 'text-red-600' : 'text-gray-900 dark:text-gray-200'}`}>
                            {new Date(p.nextPremiumDue).toLocaleDateString('en-IN')}
                          </p>
                          {new Date(p.nextPremiumDue) < new Date() && (
                            <p className="text-[10px] text-red-500">Overdue</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} type="policy" />
                    </td>
                    {userRole === 'owner' && (
                      <td className="px-4 py-3">
                        <AgentLabel agentName={p.agentId?.name} agentEmail={p.agentId?.email} />
                      </td>
                    )}
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <Link href={`/policies/${p._id}`} className="text-xs text-primary hover:underline font-medium">View</Link>
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
          <span className="text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} policies
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
