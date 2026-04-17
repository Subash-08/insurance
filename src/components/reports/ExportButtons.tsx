"use client";

import { useState, useEffect } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { downloadCSV, REPORT_COLUMNS } from "@/lib/csv-export";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { formatRs, formatDate } from "@/lib/pdf/report-pdf";

// Dynamically import our wrapper to avoid ESM import().then() errors and SSR issues
const PdfDownloadButton = dynamic(() => import("./PdfDownloadButton"), {
  ssr: false,
  loading: () => (
    <button disabled className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 opacity-50 cursor-not-allowed">
      <FileText className="w-4 h-4 mr-2" /> PDF
    </button>
  ),
});

interface ExportButtonsProps {
  reportType: keyof typeof REPORT_COLUMNS | string;
  period: string;
  agencyInfo: any;
  pdfDocumentComponent: any;
}

export default function ExportButtons({ reportType, period, agencyInfo, pdfDocumentComponent }: ExportButtonsProps) {
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [fullData, setFullData] = useState<any>(null); // for PDF
  const [fetchingPdfData, setFetchingPdfData] = useState(false);

  async function handleCsvExport() {
    setDownloadingCsv(true);
    toast.loading("Preparing CSV...", { id: "csv-export" });
    try {
      const res = await fetch(`/api/reports/${reportType}?period=${period}&export=true`);
      const { success, data, error } = await res.json();
      if (!success) throw new Error(error);

      if (data.length === 0) {
         toast.error("No data to export", { id: "csv-export" });
         return;
      }

      // Map rows based on report type
      const cols = REPORT_COLUMNS[reportType as keyof typeof REPORT_COLUMNS] || Object.keys(data[0] || {});
      
      const rows = data.map((row: any) => {
        if (reportType === "expiry") {
          return [row.clientName, row.phone, row.policyNumber, row.insurer, row.type, (row.sumAssured || 0)/100, (row.totalPremium || 0)/100, formatDate(row.endDate), Math.floor((new Date(row.endDate).getTime() - Date.now()) / 86400000), row.agentName];
        } else if (reportType === "premium_collection") {
          return [formatDate(row.paidDate), row.clientName, row.clientPhone, row.policyNumber, row.insurer, row.policyType, row.mode, row.receiptNumber, (row.amount || 0)/100, row.agentName];
        } else if (reportType === "lapse_risk") {
          return [row.clientName, row.phone, row.policyNumber, row.insurer, row.type, (row.sumAssured || 0)/100, (row.amount || 0)/100, formatDate(row.dueDate), row.daysOverdue, row.agentName];
        } else if (reportType === "commission") {
          return [row.month, row.policyNumber, row.clientName, row.insurer, row.policyType, (row.premium || 0)/100, row.rate, (row.commission || 0)/100, row.status, row.agentName];
        }
        // Fallback
        return Object.values(row);
      });

      downloadCSV(`${reportType}_report_${period}`, cols, rows);
      toast.success("CSV Downloaded!", { id: "csv-export" });
    } catch (err) {
      toast.error("Failed to generate CSV export", { id: "csv-export" });
    } finally {
      setDownloadingCsv(false);
    }
  }

  // To generate PDF, we need the full data payload just in time, or we can fetch it once user clicks
  // But PDFDownloadLink needs the document immediately. 
  // Let's implement a pattern where user clicks "Load PDF", we fetch data, then render link
  
  const handleLoadPdf = async () => {
    setFetchingPdfData(true);
    toast.loading("Preparing PDF...", { id: "pdf-export" });
    try {
      const res = await fetch(`/api/reports/${reportType}?period=${period}&export=true`);
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      if (d.data.length === 0) {
        toast.error("No data to export", { id: "pdf-export" });
        return;
      }
      setFullData({ data: d.data, dateRange: `${formatDate(d.dateRange?.start)} to ${formatDate(d.dateRange?.end)}` });
      toast.success("PDF Ready! Click Export again.", { id: "pdf-export" });
    } catch (err) {
      toast.error("Failed to load PDF data", { id: "pdf-export" });
    } finally {
      setFetchingPdfData(false);
    }
  };

  const DocumentComponent = pdfDocumentComponent;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCsvExport}
        disabled={downloadingCsv}
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors disabled:opacity-50"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600 dark:text-green-500" />
        {downloadingCsv ? "Exporting..." : "Export CSV"}
      </button>

      {!fullData ? (
        <button
          onClick={handleLoadPdf}
          disabled={fetchingPdfData}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors disabled:opacity-50"
        >
          <FileText className="w-4 h-4 mr-2 text-red-600 dark:text-red-500" />
          {fetchingPdfData ? "Generating..." : "Generate PDF"}
        </button>
      ) : (
        <PdfDownloadButton
          document={<DocumentComponent data={fullData.data} dateRange={fullData.dateRange} agencyInfo={agencyInfo} />}
          fileName={`${reportType}_report_${period}.pdf`}
        />
      )}
    </div>
  );
}
