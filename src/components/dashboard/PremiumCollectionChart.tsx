"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";

function formatLakhs(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 100000) {
    return `₹${+(rupees / 100000).toFixed(2)}L`;
  }
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export default function PremiumCollectionChart() {
  const [data, setData] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/charts?type=monthly_premium")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
      })
      .catch(() => toast.error("Failed to load chart data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[350px] animate-pulse flex flex-col">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        <div className="flex-1 flex items-end gap-2 px-4">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
            <div key={i} className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-t-sm" style={{ height: `${Math.max(10, Math.random() * 100)}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Premium Collection (12 Months)</h3>
      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No premium data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }} 
                tickFormatter={(val) => formatLakhs(val)}
              />
              <Tooltip
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => [new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((val || 0) / 100), "Premium"]}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#3B82F6" /> // blue-500
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
