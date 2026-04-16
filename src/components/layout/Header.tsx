'use client';

import React, { useState } from 'react';
import { Menu, Bell, User as UserIcon, Settings, LogOut, Check } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Breadcrumb from './Breadcrumb';
import OwnerOnly from './OwnerOnly';

export default function Header({ setIsSidebarOpen }: { setIsSidebarOpen: (b: boolean) => void }) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown if clicked outside - basic implementation
  // In a robust app, use Radix UI DropdownMenu or React's exact standard.
  // We use standard div tracking here with blur handling.

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
      
      {/* Left side */}
      <div className="flex items-center flex-1">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden mr-4"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        
        {/* Notifications */}
        <button className="text-gray-400 hover:text-gray-500 relative p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
          <Bell size={20} />
          {/* Unread badge */}
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
            3
          </span>
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" aria-hidden="true" />

        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
            className="flex items-center focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block ml-2 text-left">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">
                {session?.user?.name || 'User'}
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 z-50">
              
              <div className="px-4 py-3">
                <p className="text-sm text-gray-900 dark:text-white">Signed in as</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{session?.user?.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${session?.user?.role === 'owner' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                    {session?.user?.role === 'owner' ? 'Owner' : 'Employee'}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link href="/settings/profile" className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <UserIcon size={16} className="mr-3 text-gray-400 group-hover:text-gray-500" />
                  View Profile
                </Link>
                <Link href="/settings/profile#password" className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Settings size={16} className="mr-3 text-gray-400 group-hover:text-gray-500" />
                  Change Password
                </Link>
              </div>

              <OwnerOnly>
                <div className="py-1">
                  <Link href="/settings/team" className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <UsersIconPlaceholder size={16} className="mr-3 text-gray-400 group-hover:text-gray-500" />
                    Team Management
                  </Link>
                  <Link href="/settings/agency" className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <AgencyIconPlaceholder size={16} className="mr-3 text-gray-400 group-hover:text-gray-500" />
                    Agency Settings
                  </Link>
                </div>
              </OwnerOnly>

              <div className="py-1">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full text-left group flex items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut size={16} className="mr-3 text-red-400 group-hover:text-red-500" />
                  Sign out
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
}

// Just placeholders for Owner menu icons
function UsersIconPlaceholder(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}

function AgencyIconPlaceholder(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}
