"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

interface AgentPerformance {
  _id: string; // user id
  name: string;
  designation?: string;
  profilePhoto?: string;
  clientsAdded: number;
  policiesAdded: number;
  premiumCollected: number; // paise
  commission: number; // paise
  activeLeads: number;
  lastLoginAt?: string;
}

interface Props {
  agents: AgentPerformance[];
}

type SortField = "name" | "clientsAdded" | "policiesAdded" | "premiumCollected" | "commission" | "activeLeads";

export default function AgencyPerformanceTable({ agents }: Props) {
  const [sortField, setSortField] = useState<SortField>("premiumCollected");
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default to desc for numeric fields
    }
  }

  const sortedAgents = [...agents].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    // String comparison
    if (typeof valA === "string" && typeof valB === "string") {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    
    // Numeric comparison
    valA = (valA as number) || 0;
    valB = (valB as number) || 0;
    return sortAsc ? valA - valB : valB - valA;
  });

  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format((paise || 0) / 100);
  };

  if (!agents || agents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-500">
        No active employees found.
      </div>
    );
  }

  const Th = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 select-none group"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortField === field ? "opacity-100 text-blue-500" : "opacity-0 group-hover:opacity-50"}`} />
      </div>
    </th>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agency Performance</h3>
        <p className="text-sm text-gray-500 mt-1">Current month metrics per agent</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <Th field="name" label="Employee" />
              <Th field="clientsAdded" label="Clients" />
              <Th field="policiesAdded" label="Policies" />
              <Th field="premiumCollected" label="Premium (₹)" />
              <Th field="commission" label="Commission" />
              <Th field="activeLeads" label="Active Leads" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedAgents.map((agent) => (
              <tr key={agent._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.designation || "Agent"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900 dark:text-white">{agent.clientsAdded}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900 dark:text-white">{agent.policiesAdded}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{formatRupees(agent.premiumCollected)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-green-600 dark:text-green-400">{formatRupees(agent.commission)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    {agent.activeLeads} open
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
