"use client";

import Link from "next/link";
import { Phone, Mail, Eye, CreditCard } from "lucide-react";
import WhatsAppButton from "@/components/shared/WhatsAppButton";

export type ActionItemType = "renewal" | "overdue" | "birthday" | "maturity" | "followup";

export interface ActionItem {
  id: string;
  clientName: string;
  clientId: string;
  clientPhone?: string;
  policyNumber?: string;
  policyId?: string;
  insurer?: string;
  policyType?: string;
  amount?: number; // in paise
  dueDate?: string | Date;
  daysOverdue?: number;
  maturityDate?: string | Date;
  email?: string;
  type: ActionItemType;
}

interface ActionPanelProps {
  title: string;
  items: ActionItem[];
  emptyMessage?: string;
  loading?: boolean;
  viewAllHref?: string;
  icon?: React.ReactNode;
}

function formatAmount(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rupees);
}

function formatDate(d: string | Date | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(d));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function AvatarCircle({ name, color }: { name: string; color: string }) {
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-rose-500",
];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

function ActionButtons({ item }: { item: ActionItem }) {
  const phone = item.clientPhone ?? "";

  switch (item.type) {
    case "renewal":
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <WhatsAppButton
            phone={phone}
            templateKey="renewal_reminder"
            variables={{
              client_name: item.clientName,
              policy_number: item.policyNumber ?? "",
              expiry_date: formatDate(item.dueDate),
              insurer: item.insurer ?? "",
            }}
            variant="icon"
            label="Send renewal reminder"
          />
          <Link
            href={`/policies/${item.policyId}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </Link>
        </div>
      );
    case "overdue":
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <WhatsAppButton
            phone={phone}
            templateKey="overdue_reminder"
            variables={{
              client_name: item.clientName,
              policy_number: item.policyNumber ?? "",
              amount: item.amount ? formatAmount(item.amount) : "",
              days_overdue: String(item.daysOverdue ?? 0),
            }}
            variant="icon"
            label="Send overdue reminder"
          />
          <Link
            href={`/premiums?clientId=${item.clientId}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 transition-colors"
          >
            <CreditCard className="w-3 h-3" />
            Pay
          </Link>
        </div>
      );
    case "birthday":
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <WhatsAppButton
            phone={phone}
            templateKey="birthday_greeting"
            variables={{ client_name: item.clientName }}
            variant="icon"
            label="Send birthday wish"
          />
          {item.email && (
            <a
              href={`mailto:${item.email}?subject=Happy Birthday ${item.clientName}!`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              title="Send email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>
      );
    case "maturity":
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <WhatsAppButton
            phone={phone}
            templateKey="maturity_alert"
            variables={{
              client_name: item.clientName,
              policy_number: item.policyNumber ?? "",
              maturity_date: formatDate(item.maturityDate),
              sum_assured: item.amount ? formatAmount(item.amount) : "",
            }}
            variant="icon"
            label="Send maturity alert"
          />
          <Link
            href={`/policies/${item.policyId}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </Link>
        </div>
      );
    case "followup":
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 transition-colors"
              title="Call client"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          <Link
            href={`/leads?clientId=${item.clientId}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition-colors"
          >
            View Lead
          </Link>
        </div>
      );
    default:
      return null;
  }
}

function ItemSubline({ item }: { item: ActionItem }) {
  switch (item.type) {
    case "renewal":
      return (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {item.insurer && <span>{item.insurer} · </span>}
          Expires {formatDate(item.dueDate)}
        </p>
      );
    case "overdue":
      return (
        <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 font-medium">
          {item.daysOverdue ? `${item.daysOverdue} days overdue` : "Due today"}{" "}
          {item.amount ? `· ${formatAmount(item.amount)} due` : ""}
        </p>
      );
    case "birthday":
      return <p className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">🎂 Birthday today!</p>;
    case "maturity":
      return (
        <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
          Matures {formatDate(item.maturityDate)}{item.amount ? ` · ${formatAmount(item.amount)}` : ""}
        </p>
      );
    case "followup":
      return (
        <p className="text-xs text-amber-500 dark:text-amber-400 mt-0.5">
          Follow-up due {formatDate(item.dueDate)}
        </p>
      );
    default:
      return null;
  }
}

export default function ActionPanel({
  title,
  items,
  emptyMessage = "No items to show",
  loading,
  viewAllHref,
}: ActionPanelProps) {
  const displayItems = items.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All →
          </Link>
        )}
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-5">
                <SkeletonRow />
              </div>
            ))}
          </>
        ) : displayItems.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          displayItems.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <AvatarCircle name={item.clientName} color={AVATAR_COLORS[idx % AVATAR_COLORS.length]} />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/clients/${item.clientId}`}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                >
                  {item.clientName}
                </Link>
                <ItemSubline item={item} />
              </div>
              <ActionButtons item={item} />
            </div>
          ))
        )}
      </div>

      {!loading && items.length > 5 && viewAllHref && (
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-center">
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            +{items.length - 5} more items
          </Link>
        </div>
      )}
    </div>
  );
}
