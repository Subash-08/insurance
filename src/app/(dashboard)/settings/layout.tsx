import React from 'react';
import { getRequiredSession } from '@/lib/session';
import Sidebar from '@/components/layout/Sidebar';
import Link from 'next/link';
import { UserCircle, Settings as SettingsIcon, Bell, Users, FileText, Banknote, Mail, Zap, ScrollText } from 'lucide-react';
import RoleGuard from '@/components/layout/RoleGuard';

const OWNER_SETTINGS = [
  { href: '/settings/profile', label: 'Profile', icon: UserCircle },
  { href: '/settings/agency', label: 'Agency', icon: SettingsIcon },
  { href: '/settings/team', label: 'Team Management', icon: Users },
  { href: '/settings/insurers', label: 'Insurers', icon: Banknote },
  { href: '/settings/templates', label: 'Policy Templates', icon: FileText },
  { href: '/settings/commission', label: 'Commission Rates', icon: Banknote },
  { href: '/settings/email', label: 'Email & Notifications', icon: Mail },
  { href: '/settings/automation', label: 'Automation (n8n)', icon: Zap },
  { href: '/settings/audit', label: 'Audit Log', icon: ScrollText },
];

const EMPLOYEE_SETTINGS = [
  { href: '/settings/profile', label: 'Profile', icon: UserCircle },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();
  const isOwner = session.user.role === 'owner';
  const navItems = isOwner ? OWNER_SETTINGS : EMPLOYEE_SETTINGS;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-64 shrink-0">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
              >
                <Icon size={18} className="text-gray-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}
