import React from 'react';
import { format, differenceInMonths, differenceInYears, differenceInDays } from 'date-fns';
import { User, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
interface Child {
  _id?: string;
  id?: string;
  parentId: string | { _id: string; name: string; email: string; phone?: string };
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
  abhaId: string;
  schedule: any[];
  createdAt?: Date | string;
}
import { MASTER_VACCINE_SCHEDULE } from '@/lib/vaccineSchedule';
import ShieldBadge from './ShieldBadge';
import { cn } from '@/lib/utils';

interface ChildCardProps {
  child: Child;
  onClick?: () => void;
  compact?: boolean;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onClick, compact }) => {
  const completedCount = child.schedule.filter(v => v.status === 'COMPLETED').length;
  const overdueCount = child.schedule.filter(v => v.status === 'OVERDUE').length;
  const pendingCount = child.schedule.filter(v => v.status === 'PENDING').length;
  const totalCount = MASTER_VACCINE_SCHEDULE.length;

  const getAge = (dob: Date | string) => {
    const dobDate = dob instanceof Date ? dob : new Date(dob);
    const years = differenceInYears(new Date(), dobDate);
    if (years >= 1) return `${years} year${years > 1 ? 's' : ''} old`;
    
    const months = differenceInMonths(new Date(), dobDate);
    if (months >= 1) return `${months} month${months > 1 ? 's' : ''} old`;
    
    const days = differenceInDays(new Date(), dobDate);
    return `${days} day${days > 1 ? 's' : ''} old`;
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="card-medical p-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            child.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
          )}>
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{child.name}</h3>
            <p className="text-sm text-muted-foreground">{getAge(child.dateOfBirth)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="card-medical p-6 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Child Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center',
              child.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
            )}>
              <User className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-xl text-foreground">{child.name}</h3>
              <p className="text-muted-foreground">{getAge(child.dateOfBirth)}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-success/10">
              <p className="text-2xl font-bold text-success">{completedCount}</p>
              <p className="text-xs text-success/80">Completed</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/10">
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
              <p className="text-xs text-warning/80">Pending</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-destructive/10">
              <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
              <p className="text-xs text-destructive/80">Overdue</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>DOB: {format(child.dateOfBirth, 'dd MMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span>ABHA: {child.abhaId.replace(/(\d{4})/g, '$1 ').trim()}</span>
            </div>
          </div>
        </div>

        {/* Shield Badge */}
        <ShieldBadge
          completedCount={completedCount}
          totalCount={totalCount}
          size="md"
        />
      </div>
    </motion.div>
  );
};

export default ChildCard;
