'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface RoleGuardProps {
  allowedRoles: Array<'owner' | 'employee'>;
  fallback?: React.ReactNode;
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * RoleGuard Component
 * 
 * Guards its children based on the current user's role.
 * 
 * @example
 * // Owner-only section:
 * <RoleGuard allowedRoles={['owner']}>
 *   <button>Delete All</button>
 * </RoleGuard>
 * 
 * @example
 * // Show different content per role:
 * <RoleGuard allowedRoles={['owner']} fallback={<EmployeeView />}>
 *   <OwnerView />
 * </RoleGuard>
 * 
 * @example
 * // Redirect employees away:
 * <RoleGuard allowedRoles={['owner']} redirectTo="/dashboard">
 *   <div>Secret Settings</div>
 * </RoleGuard>
 */
export default function RoleGuard({ allowedRoles, fallback = null, redirectTo, children }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    // Rely on SessionLoader to show skeleton, render nothing here to be safe
    return null;
  }

  const role = session?.user?.role as 'owner' | 'employee' | undefined;

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  if (redirectTo && typeof window !== 'undefined') {
    router.push(redirectTo);
    return null;
  }

  return <>{fallback}</>;
}
