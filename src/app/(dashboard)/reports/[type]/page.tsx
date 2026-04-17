"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReportViewer from "@/components/reports/ReportViewer";
import { toast } from "sonner";
import { 
  ExpiryReportDocument, 
  PremiumCollectionDocument, 
  LapseRiskDocument, 
  GenericTableDocument 
} from "@/lib/pdf/report-pdf";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const REPORT_CONFIGS: Record<string, any> = {
  expiry: {
    title: "Policy Expiry & Renewal Report",
    pdfDocumentComponent: ExpiryReportDocument,
    columns: [
      { key: "clientName", header: "Client Name", flex: 1.5 },
      { key: "phone", header: "Phone" },
      { key: "policyNumber", header: "Policy No." },
      { key: "insurer", header: "Insurer" },
      { key: "type", header: "Type" },
      { key: "totalPremium", header: "Premium", money: true },
      { key: "endDate", header: "Expiry / Maturity", isDate: true },
      { key: "agentName", header: "Agent" },
    ],
  },
  premium_collections: {
    title: "Premium Collection Report",
    pdfDocumentComponent: PremiumCollectionDocument,
    columns: [
      { key: "paidDate", header: "Date Paid", isDate: true },
      { key: "clientName", header: "Client Name", flex: 1.5 },
      { key: "policyNumber", header: "Policy No." },
      { key: "insurer", header: "Insurer" },
      { key: "mode", header: "Mode" },
      { key: "receiptNumber", header: "Receipt No." },
      { key: "amount", header: "Amount", money: true },
      { key: "agentName", header: "Agent" },
    ],
  },
  lapse_risk: {
    title: "Lapse Risk Report",
    pdfDocumentComponent: LapseRiskDocument,
    columns: [
      { key: "clientName", header: "Client Name", flex: 1.5 },
      { key: "phone", header: "Phone" },
      { key: "policyNumber", header: "Policy No." },
      { key: "amount", header: "Premium Due", money: true },
      { key: "dueDate", header: "Due Date", isDate: true },
      { key: "daysOverdue", header: "Days Overdue" },
      { key: "agentName", header: "Agent" },
    ],
  },
  commission: {
    title: "Commission & Revenue Report",
    pdfDocumentComponent: GenericTableDocument,
    columns: [
      { key: "month", header: "Month" },
      { key: "policyNumber", header: "Policy No." },
      { key: "clientName", header: "Client", flex: 1.5 },
      { key: "policyType", header: "Type" },
      { key: "premium", header: "Premium", money: true },
      { key: "rate", header: "Rate (%)" },
      { key: "commission", header: "Commission", money: true },
      { key: "status", header: "Status" },
      { key: "agentName", header: "Agent" },
    ],
  },
};

export default function ReportTypePage({ params }: { params: { type: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30_days";

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<{ data: any[]; summary: any } | null>(null);

  const config = REPORT_CONFIGS[params.type];

  // Dummy agency info - in a real app you fetch from agency settings endpoint
  const agencyInfo = {
    name: "Independent Agency",
    generatedBy: "Agent",
  };

  useEffect(() => {
    if (!config) return;

    setLoading(true);
    fetch(`/api/reports/${params.type}?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setReportData({ data: d.data, summary: d.summary });
        } else {
          toast.error(d.error || "Failed to load report");
        }
      })
      .catch(() => toast.error("Failed to load report"))
      .finally(() => setLoading(false));
  }, [params.type, period, config]);

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Invalid report type.</p>
        <Link href="/reports" className="text-blue-500 hover:underline mt-2 block">Back to Reports</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/reports" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </Link>
      </div>

      {/* Period Selector Tabs */}
      <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 inline-flex overflow-x-auto max-w-full space-x-1">
        {[
          { id: "7_days", label: "7 Days" },
          { id: "30_days", label: "30 Days" },
          { id: "90_days", label: "90 Days" },
          { id: "this_month", label: "This Month" },
          { id: "last_month", label: "Last Month" },
        ].map((p) => (
          <Link
            key={p.id}
            href={`/reports/${params.type}?period=${p.id}`}
            className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              period === p.id 
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse pt-4">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      ) : reportData ? (
        <ReportViewer
          reportType={params.type}
          title={config.title}
          period={period}
          data={reportData.data}
          summary={reportData.summary}
          columns={config.columns}
          pdfDocumentComponent={config.pdfDocumentComponent}
          agencyInfo={agencyInfo}
        />
      ) : null}
    </div>
  );
}
