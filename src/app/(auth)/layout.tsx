import { ShieldCheck, Users, TrendingUp } from 'lucide-react';
import React from 'react';
import AuthProvider from '@/components/providers/AuthProvider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider session={null}>
      <div className="min-h-screen flex bg-white dark:bg-gray-950">
        {/* Left Panel - Hidden on mobile */}
        <div className="hidden lg:flex w-1/2 bg-blue-50 dark:bg-gray-900 flex-col justify-center px-12 relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="z-10 max-w-lg">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl">I</div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">InsureFlow</span>
            </div>
            
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-4">
              Manage your insurance clients with confidence.
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
              The complete CRM solution built specifically for Indian insurance agencies and brokers.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-blue-600">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Centralized Client Data</h3>
                  <p className="text-gray-600 dark:text-gray-400">All policies, premiums, and documents in one secure place.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-green-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Automated Renewals</h3>
                  <p className="text-gray-600 dark:text-gray-400">Never miss a policy renewal with automated alerts and workflows.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-purple-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Team Management</h3>
                  <p className="text-gray-600 dark:text-gray-400">Assign leads, track team performance, and control access permissions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Full width on mobile */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
