'use client';

import React from 'react';
import RoleGuard from './RoleGuard';

/**
 * Thin wrapper over RoleGuard strictly for 'owner' access.
 * Use this for small UI elements like delete buttons that only owners should see.
 */
export default function OwnerOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['owner']}>
      {children}
    </RoleGuard>
  );
}
