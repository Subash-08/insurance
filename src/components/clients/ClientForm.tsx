'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    contact: true,
    address: true,
    nominees: true,
    medical: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    gender: 'male',
    maritalStatus: 'single',
    occupation: '',
    annualIncomeRupees: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    panNumber: '',
    aadhaarLast4: '',
    address: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
    medicalHistory: { bloodGroup: 'Unknown', existingConditions: '', smoker: false, diabetic: false, hypertensive: false, surgeries: '' },
    tags: '',
  });

  const [nominees, setNominees] = useState([
    { name: '', relationship: 'spouse', dob: '', share: 100, isMinor: false, guardianName: '' }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error('Name and Phone are required.');
      return;
    }

    setLoading(true);

    const processedNominees = nominees.filter(n => n.name.trim()).map(n => ({
      ...n,
      share: Number(n.share),
      isMinor: n.dob ? (new Date().getTime() - new Date(n.dob).getTime()) / (365.25 * 24 * 3600 * 1000) < 18 : false,
    }));

    if (processedNominees.length > 0) {
      const totalShare = processedNominees.reduce((sum, n) => sum + n.share, 0);
      if (Math.abs(totalShare - 100) > 0.01) {
        toast.error('Nominee shares must sum to 100%');
        setLoading(false);
        return;
      }
    }

    const payload = {
      ...form,
      annualIncome: form.annualIncomeRupees ? Math.round(Number(form.annualIncomeRupees) * 100) : undefined,
      nominees: processedNominees,
      medicalHistory: {
        ...form.medicalHistory,
        existingConditions: form.medicalHistory.existingConditions.split(',').map(s => s.trim()).filter(Boolean),
        surgeries: form.medicalHistory.surgeries.split(',').map(s => s.trim()).filter(Boolean),
      },
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Client added successfully');
        router.push(`/clients/${data.data._id}`);
      } else {
        toast.error(data.message || 'Failed to add client');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ title, section }: { title: string, section: string }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg font-semibold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <span>{title}</span>
      {openSections[section] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Personal Details */}
      <div className="space-y-4">
        <SectionHeader title="1. Personal Details" section="personal" />
        {openSections.personal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marital Status</label>
              <select value={form.maritalStatus} onChange={e => setForm({ ...form, maritalStatus: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600">
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occupation</label>
              <input value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Income (₹)</label>
              <input type="number" step="0.01" value={form.annualIncomeRupees} onChange={e => setForm({ ...form, annualIncomeRupees: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
          </div>
        )}
      </div>

      {/* 2. Contact & KYC */}
      <div className="space-y-4">
        <SectionHeader title="2. Contact & KYC" section="contact" />
        {openSections.contact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secondary Phone</label>
              <input value={form.secondaryPhone} onChange={e => setForm({ ...form, secondaryPhone: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN Number</label>
              <input value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} maxLength={10} className="w-full border rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhaar (Last 4 Digits)</label>
              <input value={form.aadhaarLast4} onChange={e => setForm({ ...form, aadhaarLast4: e.target.value })} maxLength={4} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="VIP, lead source..." className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
          </div>
        )}
      </div>

      {/* 3. Address */}
      <div className="space-y-4">
        <SectionHeader title="3. Address" section="address" />
        {openSections.address && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Line 1</label>
              <input value={form.address.line1} onChange={e => setForm({ ...form, address: { ...form.address, line1: e.target.value } })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Line 2</label>
              <input value={form.address.line2} onChange={e => setForm({ ...form, address: { ...form.address, line2: e.target.value } })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
              <input value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
              <input value={form.address.pincode} onChange={e => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <input value={form.address.country} onChange={e => setForm({ ...form, address: { ...form.address, country: e.target.value } })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
          </div>
        )}
      </div>

      {/* 4. Nominees */}
      <div className="space-y-4">
        <SectionHeader title="4. Nominees" section="nominees" />
        {openSections.nominees && (
          <div className="space-y-4 px-2">
            {nominees.map((n, i) => (
              <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col gap-4 relative">
                <button
                  type="button"
                  onClick={() => setNominees(nominees.filter((_, idx) => idx !== i))}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input value={n.name} onChange={e => { const nm = [...nominees]; nm[i].name = e.target.value; setNominees(nm); }} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
                    <select value={n.relationship} onChange={e => { const nm = [...nominees]; nm[i].relationship = e.target.value as any; setNominees(nm); }} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600">
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                    <input type="date" value={n.dob} onChange={e => { const nm = [...nominees]; nm[i].dob = e.target.value; setNominees(nm); }} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Share %</label>
                    <input type="number" value={n.share} onChange={e => { const nm = [...nominees]; nm[i].share = Number(e.target.value); setNominees(nm); }} max="100" min="1" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
                  </div>
                  {n.dob && (new Date().getTime() - new Date(n.dob).getTime()) / (365.25 * 24 * 3600 * 1000) < 18 && (
                    <div className="lg:col-span-4">
                      <label className="block text-sm font-medium mb-1 text-amber-700 dark:text-amber-400">Guardian Name (Minor)</label>
                      <input value={n.guardianName} onChange={e => { const nm = [...nominees]; nm[i].guardianName = e.target.value; setNominees(nm); }} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600 border-amber-300" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNominees([...nominees, { name: '', relationship: 'spouse', dob: '', share: 0, isMinor: false, guardianName: '' }])}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
            >
              <Plus size={16} /> Add Nominee
            </button>
          </div>
        )}
      </div>

      {/* 5. Medical History */}
      <div className="space-y-4">
        <SectionHeader title="5. Medical History" section="medical" />
        {openSections.medical && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
             <div className="lg:col-span-1 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm">Smoker</span>
                <input type="checkbox" checked={form.medicalHistory.smoker} onChange={e => setForm({ ...form, medicalHistory: { ...form.medicalHistory, smoker: e.target.checked } })} className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" />
             </div>
             <div className="lg:col-span-1 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm">Diabetic</span>
                <input type="checkbox" checked={form.medicalHistory.diabetic} onChange={e => setForm({ ...form, medicalHistory: { ...form.medicalHistory, diabetic: e.target.checked } })} className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" />
             </div>
             <div className="lg:col-span-1 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm">Hypertensive</span>
                <input type="checkbox" checked={form.medicalHistory.hypertensive} onChange={e => setForm({ ...form, medicalHistory: { ...form.medicalHistory, hypertensive: e.target.checked } })} className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" />
             </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
              <select value={form.medicalHistory.bloodGroup} onChange={e => setForm({ ...form, medicalHistory: { ...form.medicalHistory, bloodGroup: e.target.value } })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600">
                <option value="Unknown">Unknown</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Existing Conditions (comma separated)</label>
              <input value={form.medicalHistory.existingConditions} onChange={e => setForm({ ...form, medicalHistory: { ...form.medicalHistory, existingConditions: e.target.value } })} placeholder="e.g. Asthma, Thyroid" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Past Surgeries (comma separated)</label>
              <input value={form.medicalHistory.surgeries} onChange={e => setForm({ ...form, medicalHistory: { ...form.medicalHistory, surgeries: e.target.value } })} placeholder="e.g. Appendectomy 2018" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:border-gray-600" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={() => router.back()} className="px-6 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Saving...' : 'Add Client'}
        </button>
      </div>

    </form>
  );
}
