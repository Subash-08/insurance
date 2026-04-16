'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, ChevronDown, ChevronUp, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/shared/StatusBadge';
import ClaimHelplineButton from '@/components/shared/ClaimHelplineButton';

// ─── Types ────────────────────────────────────────────────────────────────────
type InsurerType = 'life' | 'general' | 'health' | 'composite';

interface InsurePlan {
  _id: string;
  planName: string;
  planCode?: string;
  isActive: boolean;
}

interface Insurer {
  _id: string;
  name: string;
  type: InsurerType;
  logoUrl?: string;
  email?: string;
  phone?: string;
  claimHelpline?: string;
  website?: string;
  plans: InsurePlan[];
  isActive: boolean;
  createdAt: string;
}

const TYPE_BADGE: Record<InsurerType, string> = {
  life: 'bg-blue-100 text-blue-800',
  general: 'bg-amber-100 text-amber-800',
  health: 'bg-green-100 text-green-800',
  composite: 'bg-purple-100 text-purple-800',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InsurersClient() {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [filtered, setFiltered] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState<Insurer | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchInsurers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showInactive) params.set('includeInactive', 'true');
      const res = await fetch(`/api/insurers?${params}`);
      const data = await res.json();
      if (data.success) {
        setInsurers(data.data);
      }
    } catch {
      toast.error('Failed to load insurers');
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchInsurers();
  }, [fetchInsurers]);

  useEffect(() => {
    let result = insurers;
    if (search) {
      result = result.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (typeFilter !== 'all') {
      result = result.filter((i) => i.type === typeFilter);
    }
    setFiltered(result);
  }, [insurers, search, typeFilter]);

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"? This will not affect existing policies.`)) return;
    const res = await fetch(`/api/insurers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success(`${name} deactivated`);
      fetchInsurers();
    } else {
      toast.error(data.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insurers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage insurer master list, plans, and claim helplines.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingInsurer(null); setSheetOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Add Insurer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search insurers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Types</option>
          <option value="life">Life</option>
          <option value="health">Health</option>
          <option value="general">General</option>
          <option value="composite">Composite</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            Loading insurers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-lg font-medium">No insurers found</p>
            <p className="text-sm mt-1">Add your first insurer to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Insurer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">24/7 Helpline</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Plans</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((ins) => (
                  <React.Fragment key={ins._id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {/* Logo + Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {ins.logoUrl ? (
                            <img src={ins.logoUrl} alt={ins.name} className="w-10 h-10 rounded-lg object-contain bg-gray-50 border" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {ins.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{ins.name}</p>
                            {ins.email && <p className="text-xs text-gray-400">{ins.email}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[ins.type]}`}>
                          {ins.type}
                        </span>
                      </td>
                      {/* Helpline */}
                      <td className="px-4 py-3">
                        {ins.claimHelpline ? (
                          <ClaimHelplineButton helpline={ins.claimHelpline} insurerName={ins.name} size="sm" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      {/* Plans count */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(expandedId === ins._id ? null : ins._id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-medium hover:bg-indigo-100 transition-colors"
                        >
                          {ins.plans.filter((p) => p.isActive).length} plans
                          {expandedId === ins._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ins.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ins.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => { setEditingInsurer(ins); setSheetOpen(true); }}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          {ins.isActive && (
                            <button
                              onClick={() => handleDeactivate(ins._id, ins.name)}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                              title="Deactivate"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Plans Panel */}
                    {expandedId === ins._id && (
                      <tr>
                        <td colSpan={6} className="px-4 pb-4 bg-gray-50 dark:bg-gray-700/30">
                          <PlansPanel insurer={ins} onRefresh={fetchInsurers} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Sheet */}
      {sheetOpen && (
        <InsurerSheet
          insurer={editingInsurer}
          onClose={() => setSheetOpen(false)}
          onSaved={() => { setSheetOpen(false); fetchInsurers(); }}
        />
      )}
    </div>
  );
}

// ─── Plans Panel ─────────────────────────────────────────────────────────────
function PlansPanel({ insurer, onRefresh }: { insurer: Insurer; onRefresh: () => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InsurePlan | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  const handleAddPlan = async () => {
    if (!planName.trim()) { toast.error('Plan name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/insurers/${insurer._id}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName: planName.trim(), planCode: planCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Plan added');
        setPlanName(''); setPlanCode(''); setShowAddForm(false);
        onRefresh();
      } else {
        toast.error(data.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivatePlan = async (planId: string, pName: string) => {
    if (!confirm(`Deactivate plan "${pName}"?`)) return;
    const res = await fetch(`/api/insurers/${insurer._id}/plans/${planId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Plan deactivated'); onRefresh(); }
    else toast.error(data.message);
  };

  const handleSaveEdit = async () => {
    if (!editingPlan) return;
    const res = await fetch(`/api/insurers/${insurer._id}/plans/${editingPlan._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planName: editName.trim(), planCode: editCode.trim() }),
    });
    const data = await res.json();
    if (data.success) { toast.success('Plan updated'); setEditingPlan(null); onRefresh(); }
    else toast.error(data.message);
  };

  return (
    <div className="mt-3 rounded-lg border border-indigo-100 dark:border-indigo-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20">
        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Plans for {insurer.name}</span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Plus size={12} /> Add Plan
        </button>
      </div>

      {showAddForm && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-b border-indigo-100 dark:border-indigo-800">
          <input
            placeholder="Plan name *"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="Plan code"
            value={planCode}
            onChange={(e) => setPlanCode(e.target.value)}
            className="w-28 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleAddPlan}
            disabled={saving}
            className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add'}
          </button>
          <button onClick={() => setShowAddForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
        </div>
      )}

      {insurer.plans.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-400 text-center">No plans added yet. Add your first plan.</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-gray-500">Plan Name</th>
              <th className="px-4 py-2 text-left text-gray-500">Code</th>
              <th className="px-4 py-2 text-left text-gray-500">Status</th>
              <th className="px-4 py-2 text-right text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {insurer.plans.map((plan) => (
              <tr key={plan._id} className={!plan.isActive ? 'opacity-50' : ''}>
                <td className={`px-4 py-2 font-medium ${!plan.isActive ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {editingPlan?._id === plan._id ? (
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="border rounded px-1 text-xs" />
                  ) : plan.planName}
                </td>
                <td className="px-4 py-2 text-gray-500 font-mono">
                  {editingPlan?._id === plan._id ? (
                    <input value={editCode} onChange={(e) => setEditCode(e.target.value)} className="border rounded px-1 text-xs w-20" />
                  ) : plan.planCode || '—'}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    {editingPlan?._id === plan._id ? (
                      <>
                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 font-medium">Save</button>
                        <button onClick={() => setEditingPlan(null)} className="text-gray-400">Cancel</button>
                      </>
                    ) : (
                      <>
                        {plan.isActive && (
                          <button
                            onClick={() => { setEditingPlan(plan); setEditName(plan.planName); setEditCode(plan.planCode || ''); }}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {plan.isActive && (
                          <button
                            onClick={() => handleDeactivatePlan(plan._id, plan.planName)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Deactivate
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Insurer Sheet ────────────────────────────────────────────────────────────
function InsurerSheet({
  insurer,
  onClose,
  onSaved,
}: {
  insurer: Insurer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!insurer;
  const [form, setForm] = useState({
    name: insurer?.name || '',
    type: insurer?.type || 'life',
    email: insurer?.email || '',
    phone: insurer?.phone || '',
    claimHelpline: insurer?.claimHelpline || '',
    website: insurer?.website || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Insurer name is required'); return; }
    if (!form.claimHelpline.trim()) { setError('Claim helpline is required'); return; }
    setSaving(true);
    setError('');

    const url = isEdit ? `/api/insurers/${insurer._id}` : '/api/insurers';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? 'Insurer updated' : 'Insurer created');
        onSaved();
      } else {
        setError(data.message);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />
      {/* Sheet */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Insurer' : 'Add Insurer'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Insurer Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. LIC of India"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="life">Life</option>
              <option value="health">Health</option>
              <option value="general">General</option>
              <option value="composite">Composite</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              24/7 Claim Helpline <span className="text-red-500">*</span>
              <span className="ml-1 text-xs text-gray-400" title="Agents need this number urgently during claims — always keep it updated">ⓘ</span>
            </label>
            <input
              value={form.claimHelpline}
              onChange={(e) => setForm({ ...form, claimHelpline: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. 1800-209-1415"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="https://example.com"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Insurer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
