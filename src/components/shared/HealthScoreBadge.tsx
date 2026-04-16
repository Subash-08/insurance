'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface HealthScoreBadgeProps {
  score: 'green' | 'amber' | 'red';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SCORE_CONFIG = {
  green: {
    dot: 'bg-green-500',
    label: 'Healthy',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    tooltip: 'No overdue premiums. All paid on time.',
  },
  amber: {
    dot: 'bg-amber-500',
    label: 'At Risk',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    tooltip: '1 premium is overdue (within grace period buffer).',
  },
  red: {
    dot: 'bg-red-500',
    label: 'Critical',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    tooltip: '2+ premiums overdue or one severely overdue (>30 days past grace period).',
  },
};

export default function HealthScoreBadge({
  score,
  showLabel = true,
  size = 'md',
}: HealthScoreBadgeProps) {
  const config = SCORE_CONFIG[score];
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg} ${config.text} ${textSize} font-medium`}
      title={config.tooltip}
    >
      <span className={`${dotSize} rounded-full ${config.dot} animate-pulse`} />
      {showLabel && config.label}
    </span>
  );
}

// ─── AgentLabel — only renders for owner role ─────────────────────────────────
interface AgentLabelProps {
  agentName?: string;
  agentEmail?: string;
}

export function AgentLabel({ agentName, agentEmail }: AgentLabelProps) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  if (role !== 'owner' || !agentName) return null;

  const initials = agentName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
        {initials}
      </span>
      <span title={agentEmail}>{agentName}</span>
    </span>
  );
}
