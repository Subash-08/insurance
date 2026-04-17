"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, FileText, AlertCircle, FileCheck, CircleDollarSign } from "lucide-react";
import KpiCard from "./KpiCard";
import ActionPanel from "./ActionPanel";
import RevenueTargetWidget from "./RevenueTargetWidget";
import CrossSellWidget from "./CrossSellWidget";
import AgencyPerformanceTable from "./AgencyPerformanceTable";
import dynamic from "next/dynamic";

const PremiumCollectionChart = dynamic(() => import("./PremiumCollectionChart"), { ssr: false });
const PolicyTypeChart = dynamic(() => import("./PolicyTypeChart"), { ssr: false });
const NewClientsChart = dynamic(() => import("./NewClientsChart"), { ssr: false });

function formatRupees(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${+(rupees / 100000).toFixed(2)}L`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rupees);
}

export default function OwnerDashboard({ session }: { session: any }) {
  const [stats, setStats] = useState<any>(null);
  const [actions, setActions] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(d => { if (d.success) setStats(d.data); })
      .finally(() => setLoadingStats(false));

    fetch("/api/dashboard/actions")
      .then(res => res.json())
      .then(d => { if (d.success) setActions(d.data); })
      .finally(() => setLoadingActions(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center h-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agency Overview</h1>
      </div>

      {stats?.pendingApprovals > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-md flex justify-between items-center shadow-sm">
          <div className="text-amber-800 dark:text-amber-300 text-sm">
            <span className="font-semibold">Review Required:</span> You have {stats.pendingApprovals} pending employee registration(s).
          </div>
          <Link href="/settings/team" className="text-sm font-medium bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/40 dark:hover:bg-amber-800/60 dark:text-amber-100 text-amber-900 px-3 py-1.5 rounded-md transition-colors">
            Review Now
          </Link>
        </div>
      )}

      {/* Revenue Target Widget */}
      <RevenueTargetWidget collectedThisMonth={stats?.kpis?.premiumCollectedThisMonth?.current ?? 0} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Active Clients"
          value={loadingStats ? "..." : String(stats?.kpis?.activeClients?.current ?? 0)}
          icon={Users}
          trend={stats?.kpis?.activeClients?.trend}
          color="blue"
          href="/clients"
          loading={loadingStats}
        />
        <KpiCard
          title="Active Policies"
          value={loadingStats ? "..." : String(stats?.kpis?.activePolicies?.current ?? 0)}
          icon={FileText}
          trend={stats?.kpis?.activePolicies?.trend}
          color="green"
          href="/policies"
          loading={loadingStats}
        />
        <KpiCard
          title="Premium This Month"
          value={loadingStats ? "..." : formatRupees(stats?.kpis?.premiumCollectedThisMonth?.current ?? 0)}
          icon={CircleDollarSign}
          trend={stats?.kpis?.premiumCollectedThisMonth?.trend}
          color="teal"
          loading={loadingStats}
          subtitle={`Efficiency: ${stats?.kpis?.collectionEfficiency?.current ?? 0}%`}
        />
        <KpiCard
          title="Overdue Premiums"
          value={loadingStats ? "..." : String(stats?.kpis?.overdueCount?.current ?? 0)}
          icon={AlertCircle}
          trend={stats?.kpis?.overdueCount?.trend}
          reverseTrend
          color="red"
          href="/premiums"
          loading={loadingStats}
          subtitle={stats?.kpis?.overdueAmount?.current ? `${formatRupees(stats?.kpis?.overdueAmount?.current)} total` : "Action required"}
        />
      </div>

      {/* Overdue Strip */}
      {stats?.kpis?.overdueCount?.current > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-800 dark:text-red-300 text-sm font-medium">
            Attention: {stats.kpis.overdueCount.current} premiums are currently overdue, totaling {formatRupees(stats.kpis.overdueAmount.current)}.
          </p>
        </div>
      )}

      {/* Action Panels Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActionPanel
          title="Renewals This Week"
          items={actions?.renewalsThisWeek ?? []}
          emptyMessage="No policies expiring in the next 7 days."
          loading={loadingActions}
          viewAllHref="/policies?filter=expiring"
        />
        <ActionPanel
          title="Top 5 Defaulters"
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

      {/* New Clients Chart */}
      <NewClientsChart />

      {/* Cross-Sell */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4">Cross-Sell Opportunities</h2>
      <CrossSellWidget />

      {/* Agency Performance */}
      <div className="pt-4">
        <AgencyPerformanceTable agents={stats?.agentPerformance ?? []} />
      </div>

      {/* Upcoming Maturities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <ActionPanel
          title="Upcoming Maturities (90 Days)"
          items={actions?.upcomingMaturities ?? []}
          emptyMessage="No policies maturing soon."
          loading={loadingActions}
        />
        <ActionPanel
          title="Missed Follow-ups"
          items={(actions?.missedFollowups ?? []).map((l: any) => ({
            id: l._id,
            clientId: l.clientId?._id,
            clientName: l.clientId?.fullName,
            clientPhone: l.clientId?.phone,
            dueDate: l.followUpDate,
            type: "followup" as const,
          }))}
          emptyMessage="Great! No missed follow-ups."
          loading={loadingActions}
          viewAllHref="/leads"
        />
      </div>
    </div>
  );
}
