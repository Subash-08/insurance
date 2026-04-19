"use client";

import React, { useState, useEffect } from "react";
import { LeadsKanban, ILeadData } from "@/components/leads/LeadsKanban";
import { LayoutGrid, List } from "lucide-react";
import DataTable from "@/components/shared/DataTable";
import Link from "next/link";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { generateWaLink } from "@/lib/whatsapp";

interface LeadsClientProps {
  initialData: ILeadData[];
  stats: any;
}

export default function LeadsClient({ initialData, stats }: LeadsClientProps) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  
  useEffect(() => {
    const saved = localStorage.getItem("insureflow_leads_view");
    if (saved === "list" || saved === "kanban") setView(saved);
  }, []);

  const handleViewChange = (v: "kanban" | "list") => {
    setView(v);
    localStorage.setItem("insureflow_leads_view", v);
  };

  const columns = [
    { key: "fullName", title: "Name" },
    { 
      key: "phone", 
      title: "Phone", 
      render: (row: ILeadData) => (
        <button 
          onClick={(e) => { 
            e.preventDefault(); 
            const url = generateWaLink(row.phone, `Hi ${row.fullName},`);
            if (url) window.open(url, "_blank");
          }}
          className="text-gray-900 dark:text-gray-100 hover:text-primary transition"
        >
          {row.phone}
        </button>
      )
    },
    { 
      key: "stage", 
      title: "Stage",
      render: (row: ILeadData) => <span className="capitalize">{row.stage.replace('_', ' ')}</span>
    },
    {
      key: "priority",
      title: "Priority",
      render: (row: ILeadData) => (
         <span className={`text-xs px-2 py-1 rounded-full font-medium ${
           row.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30' :
           row.priority === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
           'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
         }`}>
          {row.priority}
         </span>
      )
    },
    {
      key: "isStale",
      title: "Status",
      render: (row: ILeadData) => row.isStale ? (
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded border border-amber-200">Stale</span>
      ) : (
        <span className="text-xs text-gray-500">Active</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Alert Banner if there are stale leads */}
      {stats?.staleLeads > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg flex justify-between items-center text-amber-800 dark:text-amber-300">
          <div className="flex items-center">
            <span className="font-semibold mr-2">{stats.staleLeads} Leads need attention!</span>
            <span className="text-sm">They haven't been contacted in over 3 days.</span>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Leads Pipeline</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Pipeline Value: ₹{(stats?.totalPipeline ? stats.totalPipeline / 100000 : 0).toFixed(1)}L</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
            <button
              onClick={() => handleViewChange("kanban")}
              className={`p-1.5 rounded transition ${view === "kanban" ? "bg-white dark:bg-gray-700 shadow text-primary" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => handleViewChange("list")}
              className={`p-1.5 rounded transition ${view === "list" ? "bg-white dark:bg-gray-700 shadow text-primary" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              <List size={18} />
            </button>
          </div>
          <Link href="/leads/new" className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 text-sm font-medium transition shadow-sm border border-transparent shadow-primary/20">
            Add New Lead
          </Link>
        </div>
      </div>

      {initialData.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 shadow-sm">
          <EmptyState title="No Leads Found" description="Your sales pipeline is empty. Add a new prospect to get started." ctaLabel="Add New Lead" ctaHref="/leads/new" />
        </div>
      ) : view === "kanban" ? (
        <LeadsKanban initialLeads={initialData} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[500px]">
          <DataTable
            data={initialData}
            columns={columns}
            keyExtractor={(row: ILeadData) => row._id}
            onRowClick={(row: ILeadData) => window.location.href = `/leads/${row._id}`}
            emptyMessage="No leads match the current filters."
          />
        </div>
      )}
    </div>
  );
}
