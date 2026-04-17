"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function MonthlyCalendarView({ onActionCompleted }: { onActionCompleted?: () => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    fetch(`/api/premiums?month=${y}-${m}&groupByDate=true`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); });
  }, [currentDate, onActionCompleted]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold dark:text-white">{monthName}</h3>
        <div className="space-x-2">
          <button onClick={prevMonth} className="p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={nextMonth} className="p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-500 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700">
            No premiums scheduled for this month.
          </div>
        ) : (
          data.map(day => (
            <div key={day._id} className="p-4 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 space-y-2 hover:shadow-sm transition-shadow">
              <div className="font-bold border-b dark:border-gray-700 pb-2 text-indigo-600 dark:text-indigo-400">{day._id}</div>
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Expected:</span>
                <span>{formatCurrency(day.totalExpected / 100)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Collected:</span>
                <span className="text-green-600 dark:text-green-500 font-medium">{formatCurrency(day.totalCollected / 100)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t mt-2 border-dashed dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <span>Pending Items:</span>
                <span className={day.pendingCount > 0 ? "text-red-500 font-bold" : "text-green-500"}>{day.pendingCount}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
