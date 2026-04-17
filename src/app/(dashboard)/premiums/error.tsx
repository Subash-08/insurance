"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function PremiumsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
      <div className="flex items-center space-x-2 text-red-500">
        <AlertCircle className="h-6 w-6" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Something went wrong!</h2>
      </div>
      <p className="text-gray-500 dark:text-gray-400 max-w-md text-center">
        Failed to load premium tracking data. This might be a temporary issue.
      </p>
      <button 
        onClick={() => reset()} 
        className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
