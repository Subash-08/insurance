"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import MonthlyCalendarView from "./MonthlyCalendarView";
import PremiumsTable from "./PremiumsTable";

export default function PremiumsClient() {
  const [stats, setStats] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"list" | "calendar">("list");
  
  const refreshData = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    fetch("/api/premiums/stats")
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats); });
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Today</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.dueToday?.count || 0}</div>
            <p className="text-xs text-gray-500">{formatCurrency((stats?.dueToday?.total || 0)/100)} expecting</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Overdue Tracking</h3>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.overdue?.count || 0}</div>
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {formatCurrency((stats?.overdue?.total || 0)/100)} at risk
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Collected This Month</h3>
          </div>
          <div>
             <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency((stats?.collectedThisMonth || 0)/100)}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expected Total Month</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatCurrency((stats?.expectedThisMonth || 0)/100)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            List View
          </button>
          <button 
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${activeTab === 'calendar' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Calendar View
          </button>
        </div>
        
        <div className="pt-2">
          {activeTab === "list" && <PremiumsTable onActionCompleted={refreshData} />}
          {activeTab === "calendar" && <MonthlyCalendarView onActionCompleted={refreshData} />}
        </div>
      </div>
    </div>
  );
}
