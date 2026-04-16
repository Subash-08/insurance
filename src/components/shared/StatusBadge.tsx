'use client';

import React from 'react';
import {
  CheckCircle, Clock, AlertTriangle, XCircle,
  Shield, Car, Heart, TrendingUp, Flame, Plane, Users,
} from 'lucide-react';

type StatusType = 'policy' | 'premium' | 'claim' | 'lead' | 'employee';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon?: React.ElementType }> = {
  // Policy statuses
  active: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  lapsed: { label: 'Lapsed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  surrendered: { label: 'Surrendered', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
  matured: { label: 'Matured', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
  claimed: { label: 'Claimed', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Shield },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500', icon: XCircle },
  // Premium statuses
  upcoming: { label: 'Upcoming', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
  due: { label: 'Due', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-bold', icon: AlertTriangle },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  // Claim statuses
  filed: { label: 'Filed', className: 'bg-blue-100 text-blue-800', icon: Clock },
  under_review: { label: 'Under Review', className: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800', icon: CheckCircle },
  settled: { label: 'Settled', className: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800', icon: XCircle },
  // Employee statuses
  pending_approval: { label: 'Pending', className: 'bg-amber-100 text-amber-800', icon: Clock },
  suspended: { label: 'Suspended', className: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

export default function StatusBadge({ status, type, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}>
      {Icon && <Icon size={11} />}
      {config.label}
    </span>
  );
}
