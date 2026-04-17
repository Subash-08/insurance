"use client";

import { useState } from "react";
import { toast } from "sonner";

interface TimelineEvent {
  _id?: string;
  type: "status" | "document" | "note" | "whatsapp";
  description: string;
  notes?: string;
  changedBy?: { name: string; role?: string };
  changedAt?: string;
  createdAt?: string;
}

interface Props {
  claimId: string;
  events: TimelineEvent[];
  onEventAdded: () => void;
}

const EVENT_COLORS: Record<string, string> = {
  status: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
  document: "border-green-500 bg-green-50 dark:bg-green-900/20",
  note: "border-amber-500 bg-amber-50 dark:bg-amber-900/20",
  whatsapp: "border-purple-500 bg-purple-50 dark:bg-purple-900/20",
};

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
}

function initials(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function ClaimTimeline({ claimId, events, onEventAdded }: Props) {
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_note", note: noteText }),
      });
      const data = await res.json();
      if (data.success) {
        setNoteText("");
        onEventAdded();
        toast.success("Note added");
      } else {
        toast.error(data.error || "Failed to save note");
      }
    } catch {
      toast.error("Error saving note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="flex gap-3">
        <textarea
          rows={2}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={saveNote}
          disabled={saving || !noteText.trim()}
          className="px-4 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No timeline events yet</p>
      ) : (
        <div className="space-y-3">
          {[...events].reverse().map((event, idx) => {
            const dateStr = event.changedAt || event.createdAt || "";
            return (
              <div key={idx} className={`border-l-4 pl-4 py-2 rounded-r-lg ${EVENT_COLORS[event.type] || EVENT_COLORS.note}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-[10px] font-bold flex items-center justify-center">
                    {initials(event.changedBy?.name)}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {event.changedBy?.name || "System"}
                  </span>
                  {event.changedBy?.role && (
                    <span className="text-xs text-gray-400 capitalize">{event.changedBy.role}</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{dateStr ? relativeTime(dateStr) : ""}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200">{event.description}</p>
                {event.notes && (
                  <p className="text-xs text-gray-500 italic mt-1">"{event.notes}"</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
