"use client";

import { useState } from "react";
import ExportButtons from "./ExportButtons";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatRs, formatDate } from "@/lib/pdf/report-pdf";

interface ReportViewerProps {
  reportType: string;
  title: string;
  period: string;
  data: any[];
  summary: any;
  columns: { key: string; header: string; money?: boolean; isDate?: boolean; flex?: number }[];
  pdfDocumentComponent: any;
  agencyInfo: any;
}

const ITEMS_PER_PAGE = 20;

export default function ReportViewer({
  reportType,
  title,
  period,
  data,
  summary,
  columns,
  pdfDocumentComponent,
  agencyInfo,
}: ReportViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Search filtering
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return Object.values(row).some((val) => 
      val && String(val).toLowerCase().includes(lowerTerm)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Viewing Top 50 results. Use Export for full dataset (Max 1000).</p>
        </div>
        <ExportButtons 
          reportType={reportType} 
          period={period} 
          agencyInfo={agencyInfo} 
          pdfDocumentComponent={pdfDocumentComponent} 
        />
      </div>

      {/* Summary Stats */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary).map(([key, val], idx) => {
            const isMoney = key.toLowerCase().includes('amount') || key.toLowerCase().includes('premium') || key.toLowerCase().includes('commission') || key.toLowerCase().includes('assured') || key.toLowerCase().includes('collected');
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            return (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {isMoney ? formatRs(val as number) : String(val)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in view..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-4 py-3 font-medium text-gray-500 dark:text-gray-400 ${col.money ? 'text-right' : ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No records match your criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-4 py-3 text-gray-900 dark:text-white ${col.money ? 'text-right font-medium' : ''}`}>
                        {col.money 
                          ? formatRs(row[col.key] || 0) 
                          : col.isDate 
                            ? formatDate(row[col.key]) 
                            : (row[col.key] || '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
            <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> of{" "}
            <span className="font-medium">{filteredData.length}</span> results
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
