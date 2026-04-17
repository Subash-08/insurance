"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, FileText, FileCheck, Target, AlertCircle } from "lucide-react";
import KpiCard from "./KpiCard";
import ActionPanel from "./ActionPanel";
import dynamic from "next/dynamic";

const PremiumCollectionChart = dynamic(() => import("./PremiumCollectionChart"), { ssr: false });
const PolicyTypeChart = dynamic(() => import("./PolicyTypeChart"), { ssr: false });

function formatRupees(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${+(rupees / 100000).toFixed(2)}L`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rupees);
}

export default function EmployeeDashboard({ session }: { session: any }) {
  const [stats, setStats] = useState<any>(null);
  const [actions, setActions] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .finally(() => setLoadingStats(false));

    fetch("/api/dashboard/actions")
      .then((res) => res.json())
      .then((d) => { if (d.success) setActions(d.data); })
      .finally(() => setLoadingActions(false));
  }, []);

  const now = new Date();
  const dateString = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(now);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 h-auto md:h-10 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {session?.user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dateString}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/new" className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            + New Lead
          </Link>
          <Link href="/premiums" className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Record Payment
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="My Active Clients"
          value={loadingStats ? "..." : String(stats?.kpis?.activeClients?.current ?? 0)}
          icon={Users}
          trend={stats?.kpis?.activeClients?.trend}
          color="blue"
          href="/clients"
          loading={loadingStats}
        />
        <KpiCard
          title="My Policies"
          value={loadingStats ? "..." : String(stats?.kpis?.activePolicies?.current ?? 0)}
          icon={FileText}
          trend={stats?.kpis?.activePolicies?.trend}
          color="green"
          href="/policies"
          loading={loadingStats}
        />
        <KpiCard
          title="My Collections (Month)"
          value={loadingStats ? "..." : formatRupees(stats?.kpis?.premiumCollectedThisMonth?.current ?? 0)}
          icon={FileCheck}
          trend={stats?.kpis?.premiumCollectedThisMonth?.trend}
          color="teal"
          href="/premiums"
          loading={loadingStats}
        />
        <KpiCard
          title="My Active Leads"
          value={loadingStats ? "..." : String(stats?.kpis?.activeLeads?.current ?? 0)}
          icon={Target}
          trend={stats?.kpis?.activeLeads?.trend}
          color="amber"
          href="/leads"
          loading={loadingStats}
        />
      </div>

      {stats?.kpis?.overdueCount?.current > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-800 dark:text-red-300 text-sm font-medium">
            Attention: You have {stats.kpis.overdueCount.current} overdue premium payments in your list, totaling {formatRupees(stats.kpis.overdueAmount.current)}. Please follow up.
          </p>
        </div>
      )}

      {/* My Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionPanel
          title="My Upcoming Renewals"
          items={actions?.renewalsThisWeek ?? []}
          emptyMessage="No renewals in the next 7 days."
          loading={loadingActions}
          viewAllHref="/policies?filter=expiring"
        />
        <ActionPanel
          title="My Defaulters"
          items={(stats?.topDefaulters ?? []).map((d: any) => ({
            id: d._id || d.clientId,
            type: "overdue" as const,
            clientName: d.clientName,
            clientId: d.clientId,
            clientPhone: d.clientPhone,
            policyNumber: d.policyNumber,
            amount: d.balanceAmount,
            daysOverdue: d.daysOverdue,
          }))}
          emptyMessage="No overdue premiums!"
          loading={loadingStats}
          viewAllHref="/premiums?filter=overdue"
        />
        <ActionPanel
          title="Today's Lead Follow-ups"
          items={(actions?.scheduledLeadFollowups ?? []).map((l: any) => ({
            id: l._id,
            clientId: l.clientId?._id,
            clientName: l.clientId?.fullName,
            clientPhone: l.clientId?.phone,
            dueDate: l.followUpDate,
            type: "followup" as const,
          }))}
          emptyMessage="No follow-ups today."
          loading={loadingActions}
          viewAllHref="/leads"
        />
        <ActionPanel
          title="Today's Birthdays"
          items={actions?.todayBirthdays ?? []}
          emptyMessage="No birthdays today."
          loading={loadingActions}
          viewAllHref="/clients"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PremiumCollectionChart />
        </div>
        <div>
          <PolicyTypeChart />
        </div>
      </div>
    </div>
  );
}
