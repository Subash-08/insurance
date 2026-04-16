import React from 'react';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Link from 'next/link';

export default async function OwnerDashboard({ session }: { session: any }) {
  await dbConnect();

  // Basic stats fetch
  const pendingCount = await User.countDocuments({ role: 'employee', status: 'pending_approval' });
  const activeEmployees = await User.countDocuments({ role: 'employee', status: 'active' });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center h-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agency Overview</h1>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md flex justify-between items-center">
          <div className="text-amber-800">
            <span className="font-semibold">Review Required:</span> You have {pendingCount} pending employee registration(s) awaiting approval.
          </div>
          <Link href="/settings/team" className="text-sm font-medium bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-md transition-colors">
            Review Now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Placeholder cards to satisfy prompt shape for OwnerDashboard without having full underlying models active yet */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Active Clients</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">142</p>
          <p className="text-xs text-green-600 mt-1">Agency wide</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Active Policies</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">315</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Premium This Month</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹4.2L</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Expiring in 30 Days</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">12</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h2 className="text-lg font-bold text-gray-900 mb-4">Agency Performance</h2>
           <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400 border border-dashed">
              [ Stacked Bar Chart Placeholder ]
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-bold text-gray-900">Active Team ({activeEmployees})</h2>
               <Link href="/settings/team" className="text-sm text-primary hover:underline">Manage Team</Link>
           </div>
           
           <div className="space-y-4">
              {/* Fake row for demo representation */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                 <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">E</div>
                    <div className="ml-3">
                       <p className="text-sm font-medium text-gray-900">Example Employee</p>
                       <p className="text-xs text-gray-500">Senior Agent</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">24 Clients</p>
                    <p className="text-xs text-green-600">₹1.1L this month</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}
