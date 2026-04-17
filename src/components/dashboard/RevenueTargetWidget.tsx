"use client";

import { useState, useEffect } from "react";
import { Target, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

function formatCurrency(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

function getDaysLeftInMonth(): number {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(Date.now() + IST_OFFSET);
  const year = nowIST.getUTCFullYear();
  const month = nowIST.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return lastDay - nowIST.getUTCDate();
}

interface RevenueTargetWidgetProps {
  collectedThisMonth: number; // in paise
}

export default function RevenueTargetWidget({ collectedThisMonth }: RevenueTargetWidgetProps) {
  const [target, setTarget] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/target")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTarget(d.data.monthlyRevenueTarget ?? 0);
          setInputValue(String(Math.round((d.data.monthlyRevenueTarget ?? 0) / 100)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveTarget() {
    const rupees = parseInt(inputValue.replace(/,/g, ""), 10);
    if (isNaN(rupees) || rupees < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const paise = rupees * 100;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/target", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyRevenueTarget: paise }),
      });
      const data = await res.json();
      if (data.success) {
        setTarget(paise);
        setEditing(false);
        toast.success("Target updated!");
      } else {
        toast.error("Failed to update target");
      }
    } catch {
      toast.error("Failed to update target");
    } finally {
      setSaving(false);
    }
  }

  const daysLeft = getDaysLeftInMonth();
  const pct = target > 0 ? Math.min(100, Math.round((collectedThisMonth / target) * 100)) : 0;

  function barColor(): string {
    if (pct < 40) return "bg-red-500";
    if (pct < 70) return "bg-amber-500";
    return "bg-green-500";
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (target === 0 && !editing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Monthly Target</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Set a monthly revenue target to track progress</p>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          Set Target
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Monthly Revenue Target</h3>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">₹</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-28 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 500000"
              autoFocus
            />
            <button
              onClick={saveTarget}
              disabled={saving}
              className="w-7 h-7 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditing(false); setInputValue(String(Math.round(target / 100))); }}
              className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ease-out ${barColor()}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-300">
          <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(collectedThisMonth)}</span>
          {" "}of{" "}
          <span className="font-semibold">{formatCurrency(target)}</span>
          {" "}collected ({pct}%)
        </span>
        <span className="text-gray-400 dark:text-gray-500">
          {daysLeft} day{daysLeft !== 1 ? "s" : ""} left this month
        </span>
      </div>
    </div>
  );
}
