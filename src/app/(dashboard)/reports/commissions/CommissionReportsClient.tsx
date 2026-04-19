"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { IndianRupee, TrendingUp, CheckCircle2, Clock, Filter } from "lucide-react";

export default function CommissionReportsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/commissions/analytics");
      const json = await res.json();
      if (json.success) setData(json.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading commission analytics...</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">Failed to load data.</div>;

  const totalEarned = data.statusBreakdown.paid + data.statusBreakdown.pending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl border border-border shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
             <TrendingUp className="mr-2 text-primary" /> Commission Reports
           </h1>
           <p className="text-sm text-gray-500 mt-1">Track agency revenue generated from paid premiums.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-border">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Generated (All Time)</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
               <IndianRupee size={24} className="mr-1 text-gray-400" />
               {(totalEarned / 100).toLocaleString("en-IN")}
            </p>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-green-200 dark:border-green-900/50">
            <p className="text-sm text-green-600 dark:text-green-500 font-medium mb-1 flex items-center">
               <CheckCircle2 size={16} className="mr-1" /> Paid by Insurer
            </p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-500 flex items-center">
               <IndianRupee size={24} className="mr-1 opacity-70" />
               {(data.statusBreakdown.paid / 100).toLocaleString("en-IN")}
            </p>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-amber-200 dark:border-amber-900/50">
            <p className="text-sm text-amber-600 dark:text-amber-500 font-medium mb-1 flex items-center">
               <Clock size={16} className="mr-1" /> Outstanding / Pending
            </p>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-500 flex items-center">
               <IndianRupee size={24} className="mr-1 opacity-70" />
               {(data.statusBreakdown.pending / 100).toLocaleString("en-IN")}
            </p>
         </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-border">
         <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">Monthly Commission Trends</h3>
         <div className="h-80 relative">
            {data.monthly.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center text-gray-400">No commission data generated yet.</div>
            ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[...data.monthly].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                   <XAxis dataKey="_id" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                   <YAxis tickFormatter={(val) => `₹${(val/100).toLocaleString('en-IN')}`} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                   <Tooltip 
                     formatter={(value: any, name: any) => [`₹${(Number(value)/100).toLocaleString('en-IN')}`, name]}
                     contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Legend verticalAlign="top" height={36} />
                   <Bar dataKey="paidCommission" name="Paid" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                   <Bar dataKey="pendingCommission" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} stackId="a" />
                 </BarChart>
               </ResponsiveContainer>
            )}
         </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border overflow-hidden">
         <div className="p-4 border-b border-border bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Log Extracts</h3>
            <button className="text-sm flex items-center text-primary bg-primary/10 px-3 py-1 rounded hover:bg-primary/20 transition">
               <Filter size={14} className="mr-1" /> Filter Log
            </button>
         </div>
         <div className="p-8 text-center text-gray-500">
            Commission Log individual line items view would go here, mapping `CommissionLog.find()` to display granular policy-level earnings.
         </div>
      </div>
    </div>
  );
}
