"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Settings, CheckCircle, Clock, AlertCircle, Mail, MessageSquare } from "lucide-react";

interface Props { userRole: string; }

export default function RemindersClient({ userRole }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sent: 0, failed: 0, pending: 0 });

  useEffect(() => {
    fetch("/api/reminders?limit=20")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLogs(d.data);
          const s = d.data.reduce(
            (acc: any, l: any) => {
              if (l.status === "sent" || l.status === "delivered") acc.sent++;
              else if (l.status === "failed") acc.failed++;
              else acc.pending++;
              return acc;
            },
            { sent: 0, failed: 0, pending: 0 }
          );
          setStats(s);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const channelIcon = (channel: string) => {
    if (channel === "whatsapp") return <MessageSquare size={14} className="text-green-600" />;
    if (channel === "sms") return <Bell size={14} className="text-blue-600" />;
    return <Mail size={14} className="text-indigo-600" />;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      sent: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
      delivered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
      bounced: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reminders &amp; Automation</h1>
          <p className="text-sm text-gray-500 mt-1">Email, SMS, and WhatsApp notification logs</p>
        </div>
        {userRole === "owner" && (
          <div className="flex gap-2">
            <Link href="/reminders/templates" className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              Templates
            </Link>
            <Link href="/reminders/automation" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">
              <Settings size={14} /> Automation Rules
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Sent", value: stats.sent, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Failed", value: stats.failed, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-5 flex items-center gap-4 border border-gray-100 dark:border-gray-700`}>
            <div className={`${color} p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logs table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300">
          Recent Reminder Logs
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400 animate-pulse">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            No reminder logs yet. Logs appear here when reminders are sent via n8n or manually.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Template</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{log.clientId?.fullName || "—"}</p>
                    <p className="text-xs text-gray-400">{log.recipientPhone || log.recipientEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{log.templateSlug}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">{channelIcon(log.channel)} <span className="capitalize">{log.channel}</span></div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(log.status)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {log.sentAt ? new Date(log.sentAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* n8n status notice */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-400">
        <p className="font-semibold mb-1">n8n Integration</p>
        <p>Configure n8n automation from <Link href="/reminders/automation" className="underline font-medium">Automation Rules</Link>. Your VPS n8n instance polls <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">/api/n8n/get-due-reminders</code> and logs results back to <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">/api/n8n/log-reminder</code>.</p>
      </div>
    </div>
  );
}
