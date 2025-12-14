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
      bg: 'bg-primary/10',
      icon: 'text-primary',
      border: 'border-primary/20',
    },
    success: {
      bg: 'bg-success/10',
      icon: 'text-success',
      border: 'border-success/20',
    },
    warning: {
      bg: 'bg-warning/10',
      icon: 'text-warning',
      border: 'border-warning/20',
    },
    danger: {
      bg: 'bg-destructive/10',
      icon: 'text-destructive',
      border: 'border-destructive/20',
    },
  };

  const v = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn('card-medical p-6 border', v.border)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-display font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', v.bg)}>
          <Icon className={cn('w-6 h-6', v.icon)} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
