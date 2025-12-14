import React from 'react';
import { Shield, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateShieldLevel } from '@/lib/vaccineSchedule';
import { cn } from '@/lib/utils';

interface ShieldBadgeProps {
  completedCount: number;
  totalCount: number;
  size?: 'sm' | 'md' | 'lg';
}

const ShieldBadge: React.FC<ShieldBadgeProps> = ({ completedCount, totalCount, size = 'md' }) => {
  const { level, title, progress } = calculateShieldLevel(completedCount);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const levelColors = [
    'from-gray-400 to-gray-500',
    'from-amber-400 to-amber-600',
    'from-emerald-400 to-emerald-600',
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-primary to-secondary',
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={cn('relative', sizeClasses[size])}
      >
        {/* Shield Background */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br shadow-lg',
            levelColors[level]
          )}
        />

        {/* Shield Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className={cn(
            'text-primary-foreground drop-shadow-md',
            size === 'sm' && 'w-8 h-8',
            size === 'md' && 'w-12 h-12',
            size === 'lg' && 'w-16 h-16'
          )} />
        </div>

        {/* Level Stars */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'drop-shadow',
                size === 'sm' && 'w-2.5 h-2.5',
                size === 'md' && 'w-3 h-3',
                size === 'lg' && 'w-4 h-4',
                i < level ? 'text-warning fill-warning' : 'text-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Glow Effect */}
        {level >= 4 && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-xl"
          />
        )}
      </motion.div>

      {/* Title and Progress */}
      <div className="text-center">
        <p className={cn('font-display font-semibold text-foreground', textSizes[size])}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground">
          Level {level} • {completedCount}/{totalCount} vaccines
        </p>

        {/* Progress Bar */}
        <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-hero rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ShieldBadge;
