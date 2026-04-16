import { CircleCheckBig } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function RegisterSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-2">
        <CircleCheckBig size={48} strokeWidth={1.5} />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Registration submitted!</h1>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Your account is pending review by the agency owner. You&apos;ll be able to log in once your account is approved. This typically takes 1-2 business days.
        </p>
      </div>

      <div className="pt-4 pb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Check your email for updates.</p>
      </div>

      <Link 
        href="/login" 
        className="w-full max-w-xs flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
      >
        Back to login
      </Link>
    </div>
  );
}
