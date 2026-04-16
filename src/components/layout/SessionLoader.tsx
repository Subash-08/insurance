'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

export default function SessionLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
        {/* Sidebar Skeleton - hidden on mobile, 240px wide on desktop */}
        <div className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
            <div className="ml-3 h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
          </div>
          <div className="p-4 space-y-4">
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-6"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Skeleton */}
          <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
              <div className="hidden sm:block h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Content Area Skeleton */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 h-32 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse"></div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-900 h-96 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
