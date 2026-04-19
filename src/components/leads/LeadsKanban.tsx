"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type LeadStage = "new_inquiry" | "contacted" | "proposal_sent" | "negotiation" | "won" | "lost";

export interface ILeadData {
  _id: string;
  fullName: string;
  phone: string;
  stage: LeadStage;
  estimatedSumAssured?: number;
  priority: "low" | "medium" | "high";
  isStale?: boolean;
}

const STAGES: { id: LeadStage; title: string; color: string }[] = [
  { id: "new_inquiry", title: "New Inquiry", color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  { id: "contacted", title: "Contacted", color: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" },
  { id: "proposal_sent", title: "Proposal", color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
  { id: "negotiation", title: "Negotiation", color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  { id: "won", title: "Won", color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
  { id: "lost", title: "Lost", color: "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" },
];

export function LeadsKanban({ initialLeads }: { initialLeads: ILeadData[] }) {
  const [items, setItems] = useState<ILeadData[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id; // column id

    const activeLead = items.find((itm) => itm._id === activeId);
    if (!activeLead) return;

    const newStage = overId as LeadStage;
    if (activeLead.stage === newStage) return;

    // Strict frontend block for "won"
    if (newStage === "won") {
      toast.error("Drag restricted", {
        description: "Please open the lead and click 'Convert to Client' to securely transfer data."
      });
      return;
    }

    // Optimistic update
    setItems((items) =>
      items.map((itm) => (itm._id === activeId ? { ...itm, stage: newStage } : itm))
    );

    try {
      const res = await fetch(`/api/leads/${activeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to update stage");
        // Revert UI on failure
        setItems(initialLeads);
      }
    } catch (err) {
      toast.error("An error occurred");
      setItems(initialLeads);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-14rem)] items-start">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {STAGES.map((stage) => {
          const colItems = items.filter((i) => i.stage === stage.id);
          return (
            <KanbanColumn
              key={stage.id}
              id={stage.id}
              title={stage.title}
              colorClass={stage.color}
              items={colItems}
            />
          );
        })}
        <DragOverlay>
          {activeId ? (
            <KanbanCard lead={items.find((i) => i._id === activeId)!} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
