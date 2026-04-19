"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ILeadData } from "./LeadsKanban";
import { Phone, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { generateWaLink } from "@/lib/whatsapp";

interface KanbanCardProps {
  lead: ILeadData;
  isOverlay?: boolean;
}

export function KanbanCard({ lead, isOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };

  const borderClass = lead.isStale 
    ? "border-amber-400 dark:border-amber-500/50" 
    : "border-gray-200 dark:border-gray-700 border-b-gray-300 dark:border-b-gray-600";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative bg-white dark:bg-gray-800 p-3 rounded-lg border-2 ${borderClass} shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing`}
    >
      {/* Stale Badge */}
      {lead.isStale && (
        <div className="absolute -top-2 -right-2 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center border border-amber-200 dark:border-amber-800 shadow-sm z-10 animate-pulse">
          <AlertTriangle size={10} className="mr-1" /> Stale
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <Link 
          href={`/leads/${lead._id}`} 
          className="font-medium text-gray-900 dark:text-gray-100 text-sm hover:text-primary transition line-clamp-1 pr-2"
          onClick={(e) => isDragging && e.preventDefault()}
        >
          {lead.fullName}
        </Link>
        <div className="flex space-x-1 shrink-0">
           <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColors[lead.priority]}`}>
            {lead.priority.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between items-end mt-3">
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
          {lead.estimatedSumAssured ? (
            <span>₹{(lead.estimatedSumAssured / 100000).toFixed(1)}L SA</span>
          ) : (
            <span>-- SA</span>
          )}
        </div>

        <button 
          onPointerDown={(e) => {
            e.stopPropagation();
            const url = generateWaLink(lead.phone, `Hi ${lead.fullName}, I have an update on your insurance inquiry.`);
            if (url) window.open(url, "_blank");
          }}
          className="text-gray-400 hover:text-green-500 bg-gray-50 hover:bg-green-50 dark:bg-gray-700 dark:hover:bg-green-900/30 p-1.5 rounded-full transition-colors z-10"
          title="WhatsApp Quick Send"
        >
          <Phone size={14} />
        </button>
      </div>
    </div>
  );
}
