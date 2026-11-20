import React from 'react';
import { Shield, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateShieldLevel } from '@/lib/vaccineSchedule';
import { cn } from '@/lib/utils';

interface ShieldBadgeProps {
  completedCount: number;
  totalCount: number;
  size?: 'sm' | 'md' | 'lg';
  showContainer?: boolean;
}

const ShieldBadge: React.FC<ShieldBadgeProps> = ({ 
  completedCount, 
  totalCount, 
  size = 'md',
  showContainer = false 
}) => {
  const { level, title } = calculateShieldLevel(completedCount);

  const levelGradients = [
    'from-slate-500 to-slate-700 text-slate-300 border-slate-500/30',
    'from-amber-500 to-orange-600 text-amber-300 border-amber-500/30',
    'from-emerald-500 to-teal-600 text-emerald-300 border-emerald-500/30',
    'from-blue-500 to-cyan-600 text-blue-300 border-blue-500/30',
    'from-purple-500 to-indigo-600 text-purple-300 border-purple-500/30',
    'from-emerald-400 via-teal-500 to-cyan-500 text-teal-200 border-teal-400/40',
  ];

  const levelGlows = [
    'shadow-slate-500/10',
    'shadow-amber-500/20',
    'shadow-emerald-500/25',
    'shadow-blue-500/25',
    'shadow-purple-500/25',
    'shadow-teal-400/30',
  ];

  const badgeContent = (
    <div className="flex flex-col items-center justify-center text-center w-full">
      {/* Shield Icon Container with Level Glow */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative mb-2.5 flex items-center justify-center"
      >
        <div
          className={cn(
            'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg border relative transition-transform hover:scale-105',
            levelGradients[level],
            levelGlows[level]
          )}
        >
          <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" />
        </div>

        {/* Floating Star Level Chip */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-card/95 border border-border/80 shadow-md flex items-center gap-0.5 whitespace-nowrap z-10">
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
          <span className="text-[10px] font-extrabold text-foreground font-mono">
            {level === 0 ? '0/5' : `Lvl ${level}`}
          </span>
        </div>
      </motion.div>

      {/* Title & Stars Display */}
      <div className="mt-1 space-y-0.5 w-full">
        <p className="font-display font-extrabold text-xs sm:text-sm text-foreground tracking-tight truncate">
          {title}
        </p>

        {/* 5-Star Row */}
        <div className="flex items-center justify-center gap-1 my-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-2.5 h-2.5 transition-all',
                i < level
                  ? 'text-amber-400 fill-amber-400 drop-shadow-2xs'
                  : 'text-muted-foreground/25'
              )}
            />
          ))}
        </div>

        <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
          {completedCount} of {totalCount} vaccines
        </p>
      </div>
    </div>
  );

  if (showContainer) {
    return (
      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 backdrop-blur-md flex items-center justify-center shadow-2xs h-full w-full">
        {badgeContent}
      </div>
    );
  }

  return badgeContent;
};

export default ShieldBadge;
