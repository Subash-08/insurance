"use client";

import { VALID_STATUS_TRANSITIONS } from "@/lib/claims-helpers";

const STATUS_ORDER = [
  "filed",
  "documents_submitted",
  "under_insurer_review",
  "additional_info_required",
  "approved",
  "settlement_received",
  "closed",
];

const STATUS_LABELS: Record<string, string> = {
  filed: "Filed",
  documents_submitted: "Docs Submitted",
  under_insurer_review: "Under Review",
  additional_info_required: "Info Required",
  approved: "Approved",
  settlement_received: "Settled",
  closed: "Closed",
  rejected: "Rejected",
};

interface Props {
  currentStatus: string;
  statusHistory: Array<{ status: string; changedAt: string; notes?: string }>;
}

export default function ClaimStatusStepper({ currentStatus, statusHistory }: Props) {
  const isRejected = currentStatus === "rejected";

  const getDateFor = (status: string) => {
    const entry = [...statusHistory].reverse().find((h) => h.status === status);
    if (!entry) return null;
    return new Date(entry.changedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  };

  const displaySteps = isRejected
    ? [...STATUS_ORDER.slice(0, STATUS_ORDER.indexOf(currentStatus) + 1).filter(s => s !== "rejected"), "rejected"]
    : STATUS_ORDER;

  return (
    <>
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-start overflow-x-auto pb-2">
        {displaySteps.map((status, idx) => {
          const isCompleted = statusHistory.some((h) => h.status === status);
          const isCurrent = currentStatus === status;
          const isRej = status === "rejected";
          const dateStr = getDateFor(status);

          return (
            <div key={status} className="flex items-start flex-1 min-w-[100px]">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${isRej ? "bg-red-500 border-red-500 text-white"
                    : isCompleted ? "bg-primary border-primary text-white"
                    : isCurrent ? "border-primary text-primary animate-pulse"
                    : "border-gray-300 text-gray-400"}`}>
                  {isRej ? "✗" : isCompleted ? "✓" : idx + 1}
                </div>
                <div className={`mt-1 text-center text-xs font-medium whitespace-nowrap
                  ${isRej ? "text-red-600" : isCurrent ? "text-primary" : isCompleted ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}`}>
                  {STATUS_LABELS[status]}
                </div>
                {dateStr && (
                  <div className="text-[10px] text-gray-400 mt-0.5 text-center">{dateStr}</div>
                )}
              </div>
              {idx < displaySteps.length - 1 && (
                <div className={`flex-1 h-0.5 mt-4 mx-1.5 ${isCompleted ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical stepper */}
      <div className="sm:hidden space-y-3">
        {displaySteps.map((status) => {
          const isCompleted = statusHistory.some((h) => h.status === status);
          const isCurrent = currentStatus === status;
          const isRej = status === "rejected";
          const dateStr = getDateFor(status);

          return (
            <div key={status} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2
                ${isRej ? "bg-red-500 border-red-500 text-white"
                  : isCompleted ? "bg-primary border-primary text-white"
                  : isCurrent ? "border-primary text-primary"
                  : "border-gray-300 text-gray-400"}`}>
                {isRej ? "✗" : isCompleted ? "✓" : "○"}
              </div>
              <div>
                <span className={`text-sm font-medium ${isRej ? "text-red-600" : isCurrent ? "text-primary" : "text-gray-700 dark:text-gray-300"}`}>
                  {STATUS_LABELS[status]}
                </span>
                {dateStr && <span className="text-xs text-gray-400 ml-2">{dateStr}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
