'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

const ROUTE_MAP: Record<string, string> = {
  'clients': 'Clients',
  'policies': 'Policies',
  'premiums': 'Premiums',
  'claims': 'Claims',
  'leads': 'Leads',
  'reminders': 'Reminders',
  'reports': 'Reports',
  'analytics': 'Analytics',
  'settings': 'Settings',
  'team': 'Team Management',
  'profile': 'Profile',
  'agency': 'Agency Settings',
  'insurers': 'Insurers',
  'new': 'Add New',
};

export default function Breadcrumb() {
  const pathname = usePathname();
  
  if (pathname === '/dashboard' || pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
            <Home size={16} />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/\${segments.slice(0, index + 1).join('/')}`;
          
          // Handle dynamic [id] segments roughly (if it's a mongoid length or completely numbers)
          const isId = segment.length > 20 || /^\d+$/.test(segment);
          const label = isId ? 'Detail' : ROUTE_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <li key={segment} className="flex flex-row items-center space-x-2">
              <ChevronRight size={16} className="text-gray-400" />
              {isLast || isId ? (
                <span className="text-sm font-medium text-gray-500 max-w-[150px] truncate" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link href={href} className="text-sm font-medium text-gray-700 hover:text-gray-900 truncate">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
