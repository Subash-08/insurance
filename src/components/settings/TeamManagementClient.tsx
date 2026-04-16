'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, MoreVertical, ShieldAlert, CheckCircle, Clock, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

type Status = 'all' | 'pending_approval' | 'active' | 'suspended' | 'rejected';

// Radix/Menu placeholders for basic drop-downs until shadcn is fully injected
// Real implementation will likely wrap these logic blocks using specific shadcn components,
// adhering to the core functional logic prescribed below.

export default function TeamManagementClient() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending_approval: 0, active: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/employees?status=${statusFilter}&search=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        setStats(data.stats);
      }
    } catch {
      toast.error('Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [statusFilter, searchQuery]);

  const patchEmployee = async (id: string, updates: any, successMsg: string) => {
    try {
      const res = await fetch(`/api/owner/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        toast.success(successMsg);
        fetchEmployees();
        return true;
      } else {
        const err = await res.json();
        toast.error(err.message || 'Action failed');
        return false;
      }
    } catch {
      toast.error('Sever error');
      return false;
    }
  };

  const handleApprove = (id: string) => patchEmployee(id, { status: 'active' }, 'Account approved. Employee can now log in.');
  const handleSuspend = (id: string, name: string) => {
    if (window.confirm(`Suspend ${name}? They will immediately lose access. Their data will be preserved.`)) {
      patchEmployee(id, { status: 'suspended' }, 'Account suspended.');
    }
  };
  const handleReactivate = (id: string) => patchEmployee(id, { status: 'active' }, 'Account reactivated.');

  const handleRejectPrompt = (emp: any) => {
    setSelectedEmp(emp);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (!selectedEmp) return;
    const ok = await patchEmployee(selectedEmp._id, { status: 'rejected', rejectedReason: rejectReason }, 'Registration rejected.');
    if (ok) setRejectModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval': return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800"><Clock size={12} className="mr-1" /> Pending</span>;
      case 'active': return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" /> Active</span>;
      case 'suspended': return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800"><ShieldAlert size={12} className="mr-1" /> Suspended</span>;
      case 'rejected': return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"><XCircle size={12} className="mr-1" /> Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div
          onClick={() => setStatusFilter('pending_approval')}
          className="bg-white p-4 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-50"
        >
          <p className="text-sm font-medium text-amber-600">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.pending_approval}</p>
        </div>
        <div onClick={() => setStatusFilter('active')} className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
          <p className="text-sm font-medium text-gray-500">Active</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
        </div>
        <div onClick={() => setStatusFilter('suspended')} className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
          <p className="text-sm font-medium text-gray-500">Suspended</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.suspended}</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex space-x-2">
          {['all', 'pending_approval', 'active', 'suspended', 'rejected'].map((opt) => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt as Status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize \${statusFilter === opt ? 'bg-primary text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >
              {opt.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search team..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-md text-sm w-full md:w-64"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Designation</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Registered date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    No employees found matching your criteria.
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                          {emp.name[0]?.toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{emp.name}</p>
                          <p className="text-gray-500 text-xs">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{emp.role || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(emp.status)}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(emp.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {/* Hardcoding action buttons for brevity rather than complex Dropdown mapping here */}
                      <div className="flex justify-end gap-2 text-sm">
                        {emp.status === 'pending_approval' && (
                          <>
                            <button onClick={() => handleApprove(emp._id)} className="text-green-600 hover:text-green-800 font-medium">Approve</button>
                            <button onClick={() => handleRejectPrompt(emp)} className="text-red-600 hover:text-red-800 font-medium">Reject</button>
                          </>
                        )}
                        {emp.status === 'active' && (
                          <button onClick={() => handleSuspend(emp._id, emp.name)} className="text-red-600 hover:text-red-800 font-medium">Suspend</button>
                        )}
                        {emp.status === 'suspended' && (
                          <button onClick={() => handleReactivate(emp._id)} className="text-primary hover:text-blue-800 font-medium">Reactivate</button>
                        )}
                        {emp.status === 'rejected' && (
                          <button onClick={() => handleReactivate(emp._id)} className="text-primary hover:text-blue-800 font-medium">Reconsider</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-bold">Reject Registration</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Provide an optional reason for rejecting {selectedEmp?.name}.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border rounded-md p-2 min-h-[100px] mb-4 text-sm"
              placeholder="E.g. Not an authorized agent"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={submitReject} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md">Reject Permanently</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
