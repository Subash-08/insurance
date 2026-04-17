"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const COLORS: Record<string, string> = {
  Life: "#3B82F6",    // blue-500
  Health: "#10B981",  // emerald-500
  Vehicle: "#F59E0B", // amber-500
  ULIP: "#8B5CF6",    // violet-500
  Fire: "#EF4444",    // red-500
  Travel: "#14B8A6",  // teal-500
  Group: "#F43F5E",   // rose-500
  Term: "#6366F1",    // indigo-500
};
const DEFAULT_COLOR = "#9CA3AF"; // gray-400

export default function PolicyTypeChart() {
  const [data, setData] = useState<{ type: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/charts?type=policy_types")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
      })
      .catch(() => toast.error("Failed to load chart data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[350px] animate-pulse flex flex-col items-center justify-center">
        <div className="w-48 h-48 rounded-full border-[20px] border-gray-100 dark:border-gray-700" />
      </div>
    );
  }

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Policy Portfolio</h3>
      <p className="text-sm text-gray-500 mb-6">{total} total active policies</p>
      
      <div className="h-64 w-full relative">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No active policies</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                nameKey="type"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.type] || DEFAULT_COLOR} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
