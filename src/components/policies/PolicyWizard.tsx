'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Client & Insurer' },
  { id: 2, name: 'Policy Details' },
  { id: 3, name: 'Premium Info' },
  { id: 4, name: 'Review & Issue' }
];

export default function PolicyWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [insurers, setInsurers] = useState<any[]>([]);

  const [form, setForm] = useState({
    clientId: '',
    insurerId: '',
    planName: '',
    policyNumber: '',
    type: 'life',
    startDate: '',
    maturityDate: '',
    expiryDate: '',
    sumAssuredRupees: '',
    premiumAmountRupees: '',
    gstAmountRupees: '',
    paymentFrequency: 'yearly',
    gracePeriodDays: 30,
  });

  useEffect(() => {
    // Fetch clients and insurers for dropdowns
    const fetchData = async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          fetch('/api/clients?limit=1000'),
          fetch('/api/insurers?includeInactive=false')
        ]);
        const cData = await cRes.json();
        const iData = await iRes.json();
        if (cData.success) setClients(cData.data);
        if (iData.success) setInsurers(iData.data);
      } catch (err) {
        toast.error('Failed to load dependency data.');
      }
    };
    fetchData();
  }, []);

  const handleNext = () => {
    if (step === 1 && (!form.clientId || !form.insurerId || !form.planName)) {
      toast.error('Please select Client, Insurer, and Plan.');
      return;
    }
    if (step === 2 && (!form.policyNumber || !form.startDate)) {
      toast.error('Policy Number and Start Date are required.');
      return;
    }
    if (step === 3 && (!form.sumAssuredRupees || !form.premiumAmountRupees)) {
      toast.error('Sum Assured and Base Premium are required.');
      return;
    }
    setStep(s => s + 1);
  };

  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    const sumAssured = Math.round(Number(form.sumAssuredRupees) * 100);
    const premiumAmount = Math.round(Number(form.premiumAmountRupees) * 100);
    const gstAmount = form.gstAmountRupees ? Math.round(Number(form.gstAmountRupees) * 100) : 0;
    const totalPremium = premiumAmount + gstAmount;

    const payload = {
      clientId: form.clientId,
      insurerId: form.insurerId,
      planName: form.planName,
      policyNumber: form.policyNumber,
      type: form.type,
      startDate: form.startDate,
      maturityDate: form.maturityDate || undefined,
      expiryDate: form.expiryDate || undefined,
      sumAssured,
      premiumAmount,
      gstAmount,
      totalPremium,
      paymentFrequency: form.paymentFrequency,
      gracePeriodDays: Number(form.gracePeriodDays),
      status: 'active'
    };

    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        router.push(`/policies/${data.data._id}`);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Network error creating policy.');
    } finally {
      setLoading(false);
    }
  };

  const selectedInsurer = insurers.find(i => i._id === form.insurerId);

  return (
    <div>
      {/* Stepper */}
      <div className="mb-8 hidden sm:block">
        <ul className="flex justify-between items-center w-full relative">
          {STEPS.map((s, idx) => (
            <li key={s.id} className="relative flex-1 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 relative z-10 transition-colors ${
                  step > s.id ? 'bg-primary border-primary text-white' :
                  step === s.id ? 'bg-white border-primary text-primary dark:bg-gray-800' :
                  'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700'
                }`}>
                  {step > s.id ? <Check size={14} /> : s.id}
                </div>
                <span className={`text-xs font-semibold ${step >= s.id ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {s.name}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${
                  step > s.id ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Client *</label>
              <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600">
                <option value="">-- Choose Client --</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.fullName} ({c.phone})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Select Insurer *</label>
              <select value={form.insurerId} onChange={e => setForm({...form, insurerId: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600">
                <option value="">-- Choose Insurer --</option>
                {insurers.map(i => <option key={i._id} value={i._id}>{i.name} ({i.type})</option>)}
              </select>
            </div>
            {selectedInsurer && (
              <div>
                <label className="block text-sm font-medium mb-1">Select Plan *</label>
                <select value={form.planName} onChange={e => setForm({...form, planName: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600">
                  <option value="">-- Choose Plan --</option>
                  {selectedInsurer.plans.filter((p:any) => p.isActive).map((p:any) => (
                    <option key={p.planName} value={p.planName}>{p.planName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Policy Number *</label>
              <input value={form.policyNumber} onChange={e => setForm({...form, policyNumber: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Policy Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600">
                <option value="life">Life</option><option value="health">Health</option>
                <option value="vehicle">Vehicle</option><option value="ulip">ULIP</option>
                <option value="term">Term</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Maturity Date</label>
              <input type="date" value={form.maturityDate} onChange={e => setForm({...form, maturityDate: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date (Renewable)</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sum Assured (₹) *</label>
              <input type="number" value={form.sumAssuredRupees} onChange={e => setForm({...form, sumAssuredRupees: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base Premium (₹) *</label>
              <input type="number" value={form.premiumAmountRupees} onChange={e => setForm({...form, premiumAmountRupees: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GST Amount (₹)</label>
              <input type="number" value={form.gstAmountRupees} onChange={e => setForm({...form, gstAmountRupees: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Premium: ₹{Number(form.premiumAmountRupees || 0) + Number(form.gstAmountRupees || 0)}</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Frequency *</label>
              <select value={form.paymentFrequency} onChange={e => setForm({...form, paymentFrequency: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600">
                <option value="single">Single</option><option value="yearly">Yearly</option>
                <option value="half-yearly">Half-Yearly</option><option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Grace Period Days</label>
              <input type="number" value={form.gracePeriodDays} onChange={e => setForm({...form, gracePeriodDays: Number(e.target.value)})} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">Review Policy Details</h3>
            <ul className="space-y-2 text-sm">
              <li><strong>Client:</strong> {clients.find(c => c._id === form.clientId)?.fullName}</li>
              <li><strong>Insurer:</strong> {insurers.find(i => i._id === form.insurerId)?.name}</li>
              <li><strong>Plan:</strong> {form.planName}</li>
              <li><strong>Policy Number:</strong> {form.policyNumber}</li>
              <li><strong>Type:</strong> {form.type}</li>
              <li><strong>Total Premium:</strong> ₹{Number(form.premiumAmountRupees || 0) + Number(form.gstAmountRupees || 0)} ({form.paymentFrequency})</li>
            </ul>
            <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
              Issuing this policy will automatically generate up to {(form.maturityDate || form.expiryDate) ? 'the entire upcoming premium schedule.' : '1 renewal premium.'}
            </p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          disabled={step === 1}
          onClick={handlePrev}
          className="flex items-center gap-1 font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {step < STEPS.length ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Issuing...' : <><Check size={16} /> Issue Policy</>}
          </button>
        )}
      </div>
    </div>
  );
}
