'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import HealthScoreBadge, { AgentLabel } from '@/components/shared/HealthScoreBadge';

interface Client {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: { city?: string; state?: string };
  tags: string[];
  status: string;
  healthScore: 'green' | 'amber' | 'red';
  createdAt: string;
  agentId?: { _id: string; name: string; email: string };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function ClientsListClient({
  userRole,
  userId,
}: {
  userRole: string;
  userId: string;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const fetchClients = useCallback(async (searchTerm: string, status: string, pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (status) params.set('status', status);
      params.set('page', pageNum.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchClients(search, statusFilter, 1);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search, statusFilter, fetchClients]);

  useEffect(() => {
    fetchClients(search, statusFilter, page);
  }, [page]); // eslint-disable-line

  const hasFilters = search || statusFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm font-semibold">
              {pagination.total}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Manage your client book</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Add Client
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone, email, PAN..."
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
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Health Score Legend */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs text-gray-500">
        <span className="font-medium">Health Score:</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> No overdue premiums</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 1 overdue (in grace period)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> 2+ overdue or severely late</span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-lg font-medium">No clients found</p>
            <p className="text-gray-400 text-sm mt-1">
              {hasFilters ? 'Try adjusting your filters.' : 'Add your first client to get started.'}
            </p>
            {!hasFilters && (
              <Link href="/clients/new" className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus size={14} /> Add First Client
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tags</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Health</th>
                  {userRole === 'owner' && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {clients.map((client) => (
                  <tr
                    key={client._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/clients/${client._id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {client.fullName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{client.fullName}</p>
                          <p className="text-xs text-gray-400">{client.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{client.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{client.address?.city || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {client.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {client.tags.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded text-xs">
                            +{client.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <HealthScoreBadge score={client.healthScore} showLabel={false} />
                    </td>
                    {userRole === 'owner' && (
                      <td className="px-4 py-3">
                        <AgentLabel agentName={client.agentId?.name} agentEmail={client.agentId?.email} />
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(client.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/clients/${client._id}`}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          View
                        </Link>
                        <Link
                          href={`/clients/${client._id}/edit`}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
