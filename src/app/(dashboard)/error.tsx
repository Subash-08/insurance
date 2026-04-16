'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Module Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Module Error</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-sm">
        We encountered a problem loading this section of the dashboard. Other modules should still work perfectly.
      </p>
      <div className="flex space-x-4">
        <button
          onClick={() => reset()}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-6 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Try Again
        </button>
        <Link href="/dashboard" className="bg-primary text-white py-2 px-6 rounded-md font-medium hover:bg-primary/90 transition">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
