'use client';

import { AlertTriangle, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import React from 'react';

export default function PendingApprovalPage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-2">
        <AlertTriangle size={48} strokeWidth={1.5} />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Account Pending Approval</h1>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Your account is awaiting approval from the agency owner. You&apos;ll receive an email once it&apos;s approved and ready to use.
        </p>
      </div>

      <div className="w-full max-w-xs bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
        <p>Logged in as:</p>
        <p className="font-medium text-gray-900 dark:text-white truncate">{session?.user?.email || 'Loading...'}</p>
      </div>

      <div className="pt-2 w-full max-w-xs space-y-3">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-8">
        Questions? Contact your agency owner.
      </p>
    </div>
  );
}
