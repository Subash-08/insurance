'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Edit2, Share2, Trash2, Phone, Mail, MapPin, Tag } from 'lucide-react';
import HealthScoreBadge from '@/components/shared/HealthScoreBadge';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

interface ClientDetailProps {
  clientId: string;
  userRole: string;
  userId: string;
}

export default function ClientDetailClient({ clientId, userRole, userId }: ClientDetailProps) {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'premiums' | 'claims' | 'notes'>('overview');

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load client');
      setClient(data.data);
    } catch (err: any) {
      toast.error(err.message);
      if (err.message.includes('Access denied') || err.message.includes('not found')) {
        router.push('/clients');
      }
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to deactivate ${client.fullName}?`)) return;
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Client deactivated');
        router.push('/clients');
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gave an error deleting.');
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-500">Loading profile...</div>;
  if (!client) return <div className="py-20 text-center text-gray-500">Client not found.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {client.fullName[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.fullName}</h1>
                <HealthScoreBadge score={client.healthScore} size="sm" />
                <StatusBadge status={client.status} />
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5"><Phone size={14} /> {client.phone}</span>
                {client.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {client.email}</span>}
                {client.address?.city && <span className="flex items-center gap-1.5"><MapPin size={14} /> {client.address?.city}, {client.address?.state}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Share2 size={18} />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Edit2 size={16} /> Edit
            </button>
            {userRole === 'owner' && (
              <button onClick={handleDelete} className="p-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
        
        {/* Quick Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Policies</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{client.summary?.activePoliciesCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Sum Assured</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
               <CurrencyDisplay paise={client.summary?.totalSumAssured} compact />
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Premium Paid</p>
            <p className="text-xl font-bold text-green-600">
               <CurrencyDisplay paise={client.summary?.totalPremiumPaid} compact />
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Open Claims</p>
            <p className="text-xl font-bold text-amber-600">{client.summary?.openClaimsCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'policies', label: 'Policies' },
          { id: 'premiums', label: 'Premiums' },
          { id: 'claims', label: 'Claims' },
          { id: 'notes', label: 'Notes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px]">
        {activeTab === 'overview' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><Tag size={16}/> KYC Details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">PAN Number</dt><dd className="font-medium font-mono uppercase">{client.panNumber || '—'}</dd></div>
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Aadhaar</dt><dd className="font-medium font-mono">XXXX XXXX {client.aadhaarLast4 || 'XXXX'}</dd></div>
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Date of Birth</dt><dd className="font-medium">{client.dob ? new Date(client.dob).toLocaleDateString('en-IN') : '—'}</dd></div>
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Income</dt><dd className="font-medium">{client.annualIncome ? <CurrencyDisplay paise={client.annualIncome}/> : '—'}</dd></div>
                </dl>
             </div>
             
             <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><Tag size={16}/> Nominees</h3>
                {client.nominees && client.nominees.length > 0 ? (
                  <div className="space-y-3">
                    {client.nominees.map((n: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-700 text-sm flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{n.name}</p>
                          <p className="text-gray-500 text-xs capitalize">{n.relationship} {n.isMinor ? '(Minor)' : ''}</p>
                        </div>
                        <span className="font-bold text-primary">{n.share}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No nominees added.</p>
                )}
             </div>
             
             <div className="md:col-span-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><Tag size={16}/> Medical History</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700 flex flex-wrap gap-6 text-sm">
                   <div><span className="text-gray-500 block text-xs">Blood Group</span> <strong className="text-red-500">{client.medicalHistory?.bloodGroup || 'Unknown'}</strong></div>
                   <div><span className="text-gray-500 block text-xs">Smoker</span> <strong>{client.medicalHistory?.smoker ? 'Yes' : 'No'}</strong></div>
                   <div><span className="text-gray-500 block text-xs">Diabetic</span> <strong>{client.medicalHistory?.diabetic ? 'Yes' : 'No'}</strong></div>
                   <div><span className="text-gray-500 block text-xs">Hypertensive</span> <strong>{client.medicalHistory?.hypertensive ? 'Yes' : 'No'}</strong></div>
                </div>
                {client.medicalHistory?.existingConditions?.length > 0 && (
                   <p className="text-sm mt-3"><span className="text-gray-500">Conditions:</span> {client.medicalHistory.existingConditions.join(', ')}</p>
                )}
                {client.medicalHistory?.surgeries?.length > 0 && (
                   <p className="text-sm mt-1"><span className="text-gray-500">Surgeries:</span> {client.medicalHistory.surgeries.join(', ')}</p>
                )}
             </div>
             
           </div>
        )}
        {activeTab === 'policies' && <div className="text-center py-20 text-gray-400">Policies logic will display here.</div>}
        {activeTab === 'premiums' && <div className="text-center py-20 text-gray-400">Premiums logic will display here.</div>}
        {activeTab === 'claims' && <div className="text-center py-20 text-gray-400">Claims logic will display here.</div>}
        {activeTab === 'notes' && <div className="text-center py-20 text-gray-400">Notes logic will display here.</div>}
      </div>
    </div>
  );
}
