import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert size={32} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        You do not have permission to view this record or access this page. This action may have been logged.
      </p>
      <Link 
        href="/dashboard"
        className="px-6 py-2.5 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
