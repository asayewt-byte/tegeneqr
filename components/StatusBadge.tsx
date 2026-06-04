'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, ChefHat, UtensilsCrossed, CircleDollarSign, XCircle, AlertCircle, Hourglass } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any; pulse?: boolean }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, pulse: true },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: ChefHat, pulse: true },
  ready: { label: 'Ready', color: 'bg-violet-100 text-violet-800 border-violet-200', icon: UtensilsCrossed },
  served: { label: 'Served', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: CircleDollarSign },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200', icon: CircleDollarSign },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, showIcon = true, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle };
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide',
        size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        config.color,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5', config.pulse && 'animate-pulse')} />
      )}
      {config.label}
    </motion.span>
  );
}
