"use client";

import Link from "next/link";
import { FileText, CalendarClock, Receipt, FileWarning, Wallet } from "lucide-react";

const REPORTS = [
  {
    id: "expiry",
    title: "Policy Expiries & Renewals",
    description: "Track policies nearing their expiry or maturity dates.",
    icon: CalendarClock,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    hover: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  {
    id: "premium_collections",
    title: "Premium Collections",
    description: "Detailed register of all premium payments received.",
    icon: Receipt,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    hover: "hover:border-green-300 dark:hover:border-green-700",
  },
  {
    id: "lapse_risk",
    title: "Lapse Risk Assessment",
    description: "Identify policies at risk of lapsing due to overdue premiums.",
    icon: FileWarning,
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    hover: "hover:border-red-300 dark:hover:border-red-700",
  },
  {
    id: "commission",
    title: "Commission & Revenue",
    description: "Breakdown of agency revenue and agent commissions.",
    icon: Wallet,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    hover: "hover:border-purple-300 dark:hover:border-purple-700",
  },
];

export default function ReportsHub() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate and export insights for your agency.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {REPORTS.map((report) => (
          <Link
            key={report.id}
            href={`/reports/${report.id}?period=30_days`}
            className={`flex flex-col p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${report.hover}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${report.color}`}>
              <report.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{report.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">{report.description}</p>
            
            <div className="mt-6 flex items-center text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <FileText className="w-4 h-4 mr-1.5" />
              Generate Report →
            </div>
          </Link>
        ))}
      </div>
      
      {/* Portfolio Info Box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-5 rounded-r-xl">
        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
           <FileText className="w-4 h-4" /> Client Portfolio Reports
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
          Want a specific report for a single client? You can generate individual <strong>Client Portfolio PDFs</strong> directly from any Client's detail page.
        </p>
      </div>
    </div>
  );
}
