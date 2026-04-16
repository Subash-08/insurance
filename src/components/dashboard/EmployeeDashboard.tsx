import React from 'react';
import dbConnect from '@/lib/mongodb';

export default async function EmployeeDashboard({ session }: { session: any }) {
  await dbConnect();
  // Filter every fetch by { agentId: session.user.id }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center h-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">My Clients</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Active Policies</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">48</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Premium This Month</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹1.1L</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Expiring in 30 Days</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">3</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h2 className="text-lg font-bold text-gray-900 mb-4">My Premium Collections</h2>
           <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400 border border-dashed">
              [ Bar Chart Placeholder — Isolated Data ]
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h2 className="text-lg font-bold text-gray-900 mb-4">My Activity Today</h2>
           <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-amber-900">3 Renewals Due</p>
                    <p className="text-xs text-amber-700 mt-0.5">Please contact your clients regarding upcoming expiration.</p>
                  </div>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}
