import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  delay = 0,
}) => {
  const variants = {
    default: {
      iconContainer: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500/25',
      glow: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
      topLine: 'from-teal-500 via-cyan-400 to-blue-500',
    },
    success: {
      iconContainer: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25',
      glow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      topLine: 'from-emerald-500 via-teal-400 to-emerald-400',
    },
    warning: {
      iconContainer: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/25',
      glow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      topLine: 'from-amber-500 via-orange-400 to-amber-400',
    },
    danger: {
      iconContainer: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/25',
      glow: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
      topLine: 'from-rose-500 via-red-400 to-rose-400',
    },
  };

  const v = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ delay, duration: 0.25 }}
      className={cn(
        'group relative overflow-hidden backdrop-blur-xl bg-card/85 hover:bg-card border border-border/80 shadow-lg hover:shadow-2xl transition-all rounded-3xl p-5 sm:p-6 flex flex-col justify-between cursor-default',
        v.glow
      )}
    >
      {/* Top subtle glowing hairline */}
      <div className={cn('absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity', v.topLine)} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-[11px] font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 shadow-2xs', v.iconContainer)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
