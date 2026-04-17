"use client";

import Link from "next/link";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendData {
  direction: "up" | "down" | "neutral";
  pct: number;
  label?: string;
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: TrendData;
  /** For overdue/claims: up arrow = bad (red). Default: up = good (green). */
  reverseTrend?: boolean;
  color?: "blue" | "green" | "red" | "amber" | "purple" | "teal";
  href?: string;
  loading?: boolean;
  subtitle?: string;
}

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/40",
    border: "border-green-200 dark:border-green-800",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/20",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    border: "border-red-200 dark:border-red-800",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    border: "border-purple-200 dark:border-purple-800",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-900/20",
    icon: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    border: "border-teal-200 dark:border-teal-800",
  },
};

function TrendBadge({ trend, reverseTrend }: { trend: TrendData; reverseTrend?: boolean }) {
  const { direction, pct } = trend;
  if (direction === "neutral") return <span className="text-xs text-gray-400">—</span>;

  const isPositive = reverseTrend ? direction === "down" : direction === "up";
  const colorClass = isPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400";
  const Icon = direction === "up" ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {pct}%
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  reverseTrend,
  color = "blue",
  href,
  loading,
  subtitle,
}: KpiCardProps) {
  if (loading) return <SkeletonCard />;

  const colors = COLOR_MAP[color];

  const card = (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-xl border ${colors.border}
        p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${href ? "cursor-pointer" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 leading-tight">
            {value}
          </p>
          {(trend || subtitle) && (
            <div className="flex items-center gap-2 mt-1.5">
              {trend && <TrendBadge trend={trend} reverseTrend={reverseTrend} />}
              {subtitle && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center flex-shrink-0 ml-3`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}
