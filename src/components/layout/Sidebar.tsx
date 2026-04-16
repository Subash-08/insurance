'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, FileText, CreditCard, 
  ShieldAlert, TrendingUp, Bell, BarChart2, 
  PieChart, Settings, UserCog, LogOut, Lock,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import OwnerOnly from './OwnerOnly';
import { toast } from 'sonner';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  ownerOnly: boolean;
  section: string;
};

const NAV_CONFIG: NavItem[] = [
  // Main
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, ownerOnly: false, section: 'Main' },
  
  // Operations
  { href: '/clients', label: 'Clients', icon: Users, ownerOnly: false, section: 'Operations' },
  { href: '/policies', label: 'Policies', icon: FileText, ownerOnly: false, section: 'Operations' },
  { href: '/premiums', label: 'Premiums', icon: CreditCard, ownerOnly: false, section: 'Operations' },
  { href: '/claims', label: 'Claims', icon: ShieldAlert, ownerOnly: false, section: 'Operations' },
  { href: '/leads', label: 'Leads', icon: TrendingUp, ownerOnly: false, section: 'Operations' },
  
  // Tools
  { href: '/reminders', label: 'Reminders', icon: Bell, ownerOnly: false, section: 'Tools' },
  { href: '/reports', label: 'Reports', icon: BarChart2, ownerOnly: false, section: 'Tools' },
  { href: '/reports/analytics', label: 'Analytics', icon: PieChart, ownerOnly: true, section: 'Tools' },
  
  // Admin
  { href: '/settings/profile', label: 'Settings', icon: Settings, ownerOnly: false, section: 'Admin' },
  // Team is special, entirely hidden if not owner. The others are displayed with locks.
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isOwner = role === 'owner';

  const sections = Array.from(new Set(NAV_CONFIG.map(i => i.section)));

  const handleRestrictedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.error("This section requires owner access.");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          
          <div className="flex items-center px-6 mb-6">
            <div className="w-8 h-8 bg-primary text-white flex items-center justify-center rounded-md font-bold text-lg mr-2">I</div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">InsureFlow</span>
          </div>

          <div className="px-6 mb-6">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOwner ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
              {isOwner ? 'Owner' : 'Employee'}
            </div>
          </div>

          <nav className="mt-2 flex-1 px-3 space-y-8">
            {sections.map(section => (
              <div key={section}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section}
                </h3>
                <div className="space-y-1">
                  {NAV_CONFIG.filter(item => item.section === section).map(item => {
                    const isActive = pathname.startsWith(item.href) && (item.href !== '/settings/profile' || pathname === '/settings/profile'); 
                    const Icon = item.icon;
                    const restricted = item.ownerOnly && !isOwner;

                    return (
                      <Link
                        key={item.href}
                        href={restricted ? '#' : item.href}
                        onClick={(e) => {
                          if (restricted) handleRestrictedClick(e);
                          else setIsOpen(false);
                        }}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md relative ${
                          isActive
                            ? 'bg-primary text-white'
                            : restricted
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                        title={restricted ? "Owner access required" : item.label}
                      >
                        {isActive && !restricted && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white dark:bg-gray-300 rounded-r-md"></div>}
                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive && !restricted ? 'text-white' : restricted ? 'text-gray-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'}`} />
                        <span className="flex-1">{item.label}</span>
                        {restricted && <Lock size={14} className="ml-2 text-gray-400" />}
                      </Link>
                    );
                  })}

                  {section === 'Admin' && (
                    <OwnerOnly>
                      <Link
                        href="/settings/team"
                        onClick={() => setIsOpen(false)}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          pathname.startsWith('/settings/team')
                            ? 'bg-primary text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                         <UserCog className={`mr-3 h-5 w-5 flex-shrink-0 ${pathname.startsWith('/settings/team') ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
                         Team Management
                      </Link>
                    </OwnerOnly>
                  )}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center w-full">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="ml-3 truncate flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session?.user?.email || ''}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="ml-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
