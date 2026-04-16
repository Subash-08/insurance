'use client';

import React from 'react';

interface CurrencyDisplayProps {
  /** Amount in PAISE (integer). Always pass paise — never rupees. */
  paise: number;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
}

function formatPaise(paise: number, compact: boolean): string {
  const rupees = paise / 100;
  if (compact) {
    if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(2)} Cr`;
    if (rupees >= 100_000) return `₹${(rupees / 100_000).toFixed(2)} L`;
    if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

export default function CurrencyDisplay({
  paise,
  size = 'md',
  compact = false,
  className = '',
}: CurrencyDisplayProps) {
  const exactFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

  const displayed = formatPaise(paise, compact);
  const showTooltip = compact && displayed !== exactFormatted;

  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl font-bold' : 'text-base';

  return (
    <span
      className={`font-medium tabular-nums ${sizeClass} ${className}`}
      title={showTooltip ? exactFormatted : undefined}
    >
      {displayed}
    </span>
  );
}
