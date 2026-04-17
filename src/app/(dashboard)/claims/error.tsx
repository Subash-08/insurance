"use client";
import { useEffect } from "react";
export default function ClaimsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-red-500 text-5xl">⚠️</div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Something went wrong</h2>
      <p className="text-sm text-gray-500 max-w-sm text-center">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
        Try Again
      </button>
    </div>
  );
}
