'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Edit2, Shield, Calendar, CreditCard, Activity, Tag, Trash2, Repeat, Clock, HelpCircle, XCircle } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import DocumentUploadModal from '@/components/documents/DocumentUploadModal';
import ClaimHelplineButton from '@/components/shared/ClaimHelplineButton';
import { AgentLabel } from '@/components/shared/HealthScoreBadge';

interface PolicyDetailProps {
  policyId: string;
  userRole: string;
  userId: string;
}

export default function PolicyDetailClient({ policyId, userRole, userId }: PolicyDetailProps) {
  const router = useRouter();
  const [policy, setPolicy] = useState<any>(null);
  const [premiums, setPremiums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'claims' | 'documents'>('overview');
  const [documents, setDocuments] = useState<any[]>([]);
  const [missingDocsData, setMissingDocsData] = useState<any>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchPolicyData = useCallback(async () => {
    try {
      const res = await fetch(`/api/policies/${policyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load policy');
      setPolicy(data.data);

      // Fetch premium schedule
      const premRes = await fetch(`/api/premiums?policyId=${policyId}&limit=100`);
      const premData = await premRes.json();
      if (premData.success) {
        setPremiums(premData.data);
      }

    } catch (err: any) {
      toast.error(err.message);
      if (err.message.includes('Access denied') || err.message.includes('not found')) {
        router.push('/policies');
      }
    } finally {
      setLoading(false);
    }
  }, [policyId, router]);

  const fetchDocsAndMissing = useCallback(async () => {
    if (activeTab !== 'documents') return;
    setLoadingDocs(true);
    try {
      const [docsRes, missingRes] = await Promise.all([
        fetch(`/api/documents?entityType=Policy&entityId=${policyId}`),
        fetch(`/api/documents/missing-check/${policyId}`)
      ]);
      const docsData = await docsRes.json();
      const missingData = await missingRes.json();
      
      if (docsData.success) setDocuments(docsData.data);
      if (missingData.success) setMissingDocsData(missingData.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  }, [policyId, activeTab]);

  useEffect(() => {
    fetchPolicyData();
  }, [fetchPolicyData]);

  useEffect(() => {
    fetchDocsAndMissing();
  }, [fetchDocsAndMissing]);

  const handleLapse = async () => {
    const reason = prompt('Please enter the reason for lapsing this policy:');
    if (!reason?.trim()) return;
    try {
      const res = await fetch(`/api/policies/${policyId}/lapse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lapseReason: reason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchPolicyData();
      } else toast.error(data.message);
    } catch {
      toast.error('Network error');
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-500">Loading policy details...</div>;
  if (!policy) return <div className="py-20 text-center text-gray-500">Policy not found.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center p-2">
              {policy.insurerId?.logoUrl ? (
                <img src={policy.insurerId.logoUrl} alt={policy.insurerId.name} className="w-full h-full object-contain" />
              ) : (
                <Shield size={32} className="text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{policy.policyNumber}</h1>
                <StatusBadge status={policy.status} type="policy" />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <Link href={`/clients/${policy.clientId?._id}`} className="font-medium text-primary hover:underline">
                  {policy.clientId?.fullName}
                </Link>
                <span>•</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{policy.insurerId?.name}</span>
                <span>•</span>
                <span>{policy.planName}</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-semibold uppercase tracking-wider">{policy.type}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Edit2 size={16} /> Edit
            </button>
            {policy.status === 'active' && (
               <button onClick={handleLapse} className="p-2 border border-amber-200 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100" title="Mark as Lapsed">
                 <XCircle size={18} />
               </button>
            )}
          </div>
        </div>
        
        {/* Quick Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sum Assured</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white"><CurrencyDisplay paise={policy.sumAssured} /></p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Premium ({policy.paymentFrequency})</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
               <CurrencyDisplay paise={policy.totalPremium} />
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next Premium Due</p>
            <p className={`text-xl font-bold ${policy.nextPremiumDue && new Date(policy.nextPremiumDue) < new Date() ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
               {policy.nextPremiumDue ? new Date(policy.nextPremiumDue).toLocaleDateString('en-IN') : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Claim Helpline</p>
            {policy.insurerId?.claimHelpline ? (
              <ClaimHelplineButton helpline={policy.insurerId.claimHelpline} insurerName={policy.insurerId.name} />
            ) : (
              <p className="text-xl font-bold text-gray-400">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'schedule', label: 'Premium Schedule' },
          { id: 'claims', label: 'Claims' },
          { id: 'documents', label: 'Documents' },
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><Calendar size={16}/> Terms & Dates</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Start Date</dt><dd className="font-medium">{new Date(policy.startDate).toLocaleDateString('en-IN')}</dd></div>
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Maturity Date</dt><dd className="font-medium">{policy.maturityDate ? new Date(policy.maturityDate).toLocaleDateString('en-IN') : '—'}</dd></div>
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Expiry / Renewal</dt><dd className="font-medium">{policy.expiryDate ? new Date(policy.expiryDate).toLocaleDateString('en-IN') : '—'}</dd></div>
                </dl>
             </div>
             
             <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><CreditCard size={16}/> Payment Details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Base Premium</dt><dd className="font-medium"><CurrencyDisplay paise={policy.premiumAmount}/></dd></div>
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">GST Component</dt><dd className="font-medium text-gray-400"><CurrencyDisplay paise={policy.gstAmount}/></dd></div>
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Total Modal Premium</dt><dd className="font-bold"><CurrencyDisplay paise={policy.totalPremium}/></dd></div>
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Frequency</dt><dd className="font-medium capitalize">{policy.paymentFrequency}</dd></div>
                  <div className="flex justify-between border-b pb-2 dark:border-gray-700"><dt className="text-gray-500">Grace Period</dt><dd className="font-medium">{policy.gracePeriodDays} Days</dd></div>
                </dl>
             </div>
             
             <div className="md:col-span-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><Tag size={16}/> Ownership & Audit</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700 text-sm grid grid-cols-2 lg:grid-cols-4 gap-4">
                   <div><span className="text-gray-500 block text-xs mb-1">Created At</span> <strong>{new Date(policy.createdAt).toLocaleString('en-IN')}</strong></div>
                   <div><span className="text-gray-500 block text-xs mb-1">Last Updated</span> <strong>{new Date(policy.updatedAt).toLocaleString('en-IN')}</strong></div>
                   <div className="col-span-2">
                     <span className="text-gray-500 block text-xs mb-1">Servicing Agent</span> 
                     <AgentLabel agentName={policy.agentId?.name} agentEmail={policy.agentId?.email} />
                   </div>
                </div>
             </div>
           </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">Premium Schedule</h3>
              <p className="text-sm text-gray-500">{premiums.length} records found</p>
            </div>
            {premiums.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No premium records exist for this policy.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-left">
                    <tr>
                      <th className="p-3 text-gray-500 font-medium">Due Date</th>
                      <th className="p-3 text-gray-500 font-medium">Amount</th>
                      <th className="p-3 text-gray-500 font-medium">Grace End</th>
                      <th className="p-3 text-gray-500 font-medium">Status</th>
                      <th className="p-3 text-gray-500 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {premiums.map(prem => {
                       const graceEnd = new Date(prem.dueDate);
                       graceEnd.setDate(graceEnd.getDate() + prem.gracePeriodDays);
                       return (
                         <tr key={prem._id}>
                           <td className="p-3 font-medium">{new Date(prem.dueDate).toLocaleDateString('en-IN')}</td>
                           <td className="p-3"><CurrencyDisplay paise={prem.amount} /></td>
                           <td className="p-3 text-gray-500">{graceEnd.toLocaleDateString('en-IN')}</td>
                           <td className="p-3"><StatusBadge status={prem.status} type="premium" /></td>
                           <td className="p-3 text-right">
                              {/* placeholder for actions e.g. mark paid */}
                              {prem.status !== 'paid' && prem.status !== 'cancelled' && (
                                <button className="text-primary hover:text-primary/80 font-medium text-xs">Mark Paid</button>
                              )}
                           </td>
                         </tr>
                       )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'claims' && <div className="text-center py-20 text-gray-400">Claims module coming soon.</div>}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 border border-border p-4 rounded-xl shadow-sm">
                   <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Uploaded Documents</h3>
                      <p className="text-sm text-gray-500">Manage required files for this policy.</p>
                   </div>
                   <button 
                     onClick={() => setIsUploadModalOpen(true)}
                     className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition"
                   >
                      Upload Document
                   </button>
                </div>
                
                <DocumentUploadModal 
                  isOpen={isUploadModalOpen} 
                  onClose={() => setIsUploadModalOpen(false)} 
                  entityType="Policy" 
                  entityId={policyId} 
                  onUploadSuccess={fetchDocsAndMissing} 
                />
                
                {loadingDocs ? (
                  <div className="text-center py-12 text-gray-500">Loading documents...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                     <p>No documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {documents.map(doc => (
                        <div key={doc._id} className="border border-border rounded-xl p-4 flex flex-col justify-between bg-white dark:bg-gray-800 shadow-sm relative group">
                           <div>
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">{doc.fileName}</h4>
                                <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{doc.documentType}</span>
                              </div>
                              <p className="text-xs text-gray-500 font-medium">Added: {new Date(doc.createdAt).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500 font-medium">Size: {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                           </div>
                           <div className="mt-4 flex gap-2">
                              <a href={doc.cloudinaryUrl} target="_blank" rel="noreferrer" className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-center py-2 rounded text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                 Open File
                              </a>
                           </div>
                        </div>
                     ))}
                  </div>
                )}
             </div>

             <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 border border-border rounded-xl p-5 shadow-sm">
                   <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <HelpCircle size={18} className="text-primary" /> Requirement Checklist
                   </h3>
                   <p className="text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      Based on policy type: <span className="font-semibold text-gray-700 dark:text-gray-300 uppercase">{missingDocsData?.logicalType || '...'}</span>
                   </p>
                   
                   {loadingDocs || !missingDocsData ? (
                      <div className="text-center py-4 text-xs text-gray-400">Analyzing schema...</div>
                   ) : missingDocsData?.isComplete ? (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-start gap-2 border border-green-100 dark:border-green-800">
                         <Shield size={16} className="mt-0.5" />
                         <div>
                            <p className="font-bold">Fully Compliant</p>
                            <p className="text-xs mt-0.5">All mandatory document types have been uploaded.</p>
                         </div>
                      </div>
                   ) : (
                      <div>
                         <p className="text-sm font-semibold text-amber-600 mb-2">Missing Mandatory Documents:</p>
                         <ul className="space-y-2">
                            {missingDocsData.missing.map((req: string) => (
                               <li key={req} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                  <XCircle size={16} className="text-red-500 shrink-0" />
                                  <span className="capitalize">{req.replace('_', ' ')}</span>
                               </li>
                            ))}
                         </ul>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
