"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { ILeadData } from "./LeadsKanban";

interface KanbanColumnProps {
  id: string;
  title: string;
  colorClass: string;
  items: ILeadData[];
}

export function KanbanColumn({ id, title, colorClass, items }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className={`flex flex-col flex-shrink-0 w-80 rounded-xl border ${colorClass} ${isOver ? "ring-2 ring-primary/50" : ""}`}>
      <div className="p-3 border-b border-black/5 dark:border-white/5 flex justify-between items-center backdrop-blur-sm rounded-t-xl shrink-0">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{title}</h3>
        <span className="bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-3 overflow-y-auto min-h-[150px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        <SortableContext items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          {items.map((lead) => (
            <KanbanCard key={lead._id} lead={lead} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="h-full w-full border-2 border-dashed border-gray-300/50 dark:border-gray-700/50 rounded-lg flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 font-medium italic">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
