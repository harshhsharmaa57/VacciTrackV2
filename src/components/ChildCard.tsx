import React from 'react';
import { format, differenceInMonths, differenceInYears, differenceInDays } from 'date-fns';
import { 
  User, 
  Calendar, 
  CreditCard, 
  ChevronRight, 
  ArrowRight, 
  ArrowRightLeft, 
  Trash2, 
  Stethoscope,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MASTER_VACCINE_SCHEDULE } from '@/lib/vaccineSchedule';
import ShieldBadge from './ShieldBadge';
import { cn } from '@/lib/utils';

export interface Child {
  _id?: string;
  id?: string;
  parentId: string | { _id: string; name: string; email: string; phone?: string };
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
  abhaId: string;
  doctorId?: string | { _id: string; name: string; doctorId?: string; hospitalName?: string; specialization?: string };
  schedule: any[];
  createdAt?: Date | string;
}

interface ChildCardProps {
  child: Child;
  onClick?: () => void;
  onDownloadCertificate?: (child: Child) => void;
  onTransferDoctor?: (child: Child) => void;
  onDeleteChild?: (child: Child) => void;
  compact?: boolean;
}

const ChildCard: React.FC<ChildCardProps> = ({ 
  child, 
  onClick, 
  onDownloadCertificate, 
  onTransferDoctor, 
  onDeleteChild, 
  compact 
}) => {
  const schedule = child.schedule || [];
  const completedCount = schedule.filter(v => v.status === 'COMPLETED').length;
  const overdueCount = schedule.filter(v => v.status === 'OVERDUE').length;
  const pendingCount = schedule.filter(v => v.status === 'PENDING').length;
  const totalCount = MASTER_VACCINE_SCHEDULE.length; // 26 doses in NIS 2025
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  // Find the next upcoming/overdue milestone specifically for this child
  const nextChildVaccine = schedule
    .filter(v => v.status === 'OVERDUE' || v.status === 'PENDING' || v.status === 'UPCOMING')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const getAge = (dob: Date | string) => {
    const dobDate = dob instanceof Date ? dob : new Date(dob);
    if (isNaN(dobDate.getTime())) return '';
    const years = differenceInYears(new Date(), dobDate);
    if (years >= 1) return `${years} year${years > 1 ? 's' : ''} old`;
    
    const months = differenceInMonths(new Date(), dobDate);
    if (months >= 1) return `${months} month${months > 1 ? 's' : ''} old`;
    
    const days = differenceInDays(new Date(), dobDate);
    return `${days} day${days > 1 ? 's' : ''} old`;
  };

  const formattedDob = () => {
    try {
      const dobDate = child.dateOfBirth instanceof Date ? child.dateOfBirth : new Date(child.dateOfBirth);
      return !isNaN(dobDate.getTime()) ? format(dobDate, 'dd MMM yyyy') : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const formattedAbha = child.abhaId
    ? child.abhaId.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim()
    : 'N/A';

  const doctorName = typeof child.doctorId === 'object' && child.doctorId
    ? child.doctorId.name
    : 'Not assigned';

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="backdrop-blur-md bg-card/75 border border-border/70 hover:border-emerald-500/40 hover:shadow-lg transition-all rounded-2xl p-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-xs',
            child.gender === 'male' 
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25' 
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
          )}>
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{child.name}</h3>
            <p className="text-xs text-muted-foreground">{getAge(child.dateOfBirth)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="backdrop-blur-xl bg-card/85 border border-border/80 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all rounded-3xl p-5 sm:p-6 relative overflow-hidden group flex flex-col justify-between"
    >
      {/* Top subtle gradient hairline */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Card Header: Avatar + Name + Age + Overdue Badge + Delete */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border flex-shrink-0 relative',
              child.gender === 'male'
                ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                : 'bg-gradient-to-br from-pink-500/20 to-rose-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30'
            )}>
              <User className="w-7 h-7" />
              <span className={cn(
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold text-white',
                child.gender === 'male' ? 'bg-blue-600' : 'bg-pink-600'
              )}>
                {child.gender === 'male' ? 'M' : 'F'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 
                  onClick={onClick}
                  className="font-display font-bold text-xl sm:text-2xl text-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {child.name}
                </h3>
              </div>
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>{getAge(child.dateOfBirth)}</span>
                <span className="text-border">•</span>
                <span className="text-teal-600 dark:text-teal-400">NIS 2025 Schedule</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Overdue Warning Badge */}
            {overdueCount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs"
                title={`${overdueCount} vaccinations require immediate attention`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{overdueCount} Overdue</span>
              </motion.div>
            )}

            {/* Delete Button */}
            {onDeleteChild && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChild(child);
                }}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100"
                title="Delete child record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* DOB & ABHA Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/70 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-muted-foreground">DOB:</span>
            <span className="font-semibold text-foreground">{formattedDob()}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/70 shadow-2xs font-mono">
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">ABHA</span>
            <span className="font-semibold text-foreground tracking-wider">{formattedAbha}</span>
          </span>
        </div>

        {/* Middle Section: Elevated Stats & Shield Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 items-stretch mb-4">
          {/* Stats Chips & Progress Gauge (2 cols) */}
          <div className="sm:col-span-2 space-y-3 flex flex-col justify-between">
            {/* 3 Sleek Glass Stat Counters */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center relative overflow-hidden group/stat hover:border-emerald-500/50 transition-colors shadow-2xs">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Completed</span>
                </div>
                <p className="text-xl sm:text-2xl font-black font-display text-emerald-600 dark:text-emerald-400 leading-tight">
                  {completedCount}
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center relative overflow-hidden group/stat hover:border-amber-500/50 transition-colors shadow-2xs">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Pending</span>
                </div>
                <p className="text-xl sm:text-2xl font-black font-display text-amber-600 dark:text-amber-400 leading-tight">
                  {pendingCount}
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center relative overflow-hidden group/stat hover:border-rose-500/50 transition-colors shadow-2xs">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Overdue</span>
                </div>
                <p className="text-xl sm:text-2xl font-black font-display text-rose-600 dark:text-rose-400 leading-tight">
                  {overdueCount}
                </p>
              </div>
            </div>

            {/* Dynamic Immunity Health Gauge */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Immunization Shield</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                    {progressPercent}% Protected
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  <strong className="text-foreground font-bold">{completedCount}</strong> of {totalCount} Doses
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted/80 rounded-full overflow-hidden p-0.5 border border-border/70 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Shield Tier Badge (1 col, perfectly aligned container) */}
          <div className="sm:col-span-1 flex">
            <ShieldBadge
              completedCount={completedCount}
              totalCount={totalCount}
              size="md"
              showContainer={true}
            />
          </div>
        </div>

        {/* Milestone Indicator: Next Dose for this Child */}
        {nextChildVaccine && (
          <div className={cn(
            "flex items-center justify-between text-xs px-3.5 py-2 rounded-xl border mb-3 shadow-2xs",
            nextChildVaccine.status === 'OVERDUE'
              ? "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300"
              : "bg-teal-500/10 border-teal-500/25 text-teal-800 dark:text-teal-200"
          )}>
            <div className="flex items-center gap-1.5 truncate">
              {nextChildVaccine.status === 'OVERDUE' ? (
                <span className="font-semibold inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  Due Now:
                </span>
              ) : (
                <span className="font-semibold">Next Dose:</span>
              )}
              <span className="font-bold truncate">{nextChildVaccine.name}</span>
            </div>
            <span className="text-[11px] font-mono whitespace-nowrap opacity-90 font-medium">
              {format(new Date(nextChildVaccine.dueDate), 'dd MMM yyyy')}
            </span>
          </div>
        )}

        {/* Assigned Doctor & Transfer Row */}
        <div className="flex items-center justify-between gap-2 text-xs py-2 px-3 rounded-xl bg-muted/40 border border-border/50 mb-4">
          <div className="flex items-center gap-2 truncate text-muted-foreground">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className="truncate">
              Assigned Doctor:{' '}
              <span className="font-bold text-foreground">
                {doctorName}
              </span>
            </span>
          </div>
          {onTransferDoctor && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTransferDoctor(child);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline flex-shrink-0 transition-colors"
            >
              <ArrowRightLeft className="w-3 h-3" />
              Transfer
            </button>
          )}
        </div>
      </div>

      {/* Prominent Bottom Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3.5 border-t border-border/70">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownloadCertificate?.(child);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-foreground bg-muted hover:bg-muted/80 border border-border/80 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-xs active:scale-[0.98]"
        >
          <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Download Certificate</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 transition-all active:scale-[0.98] group/btn"
        >
          <span>View Full Timeline</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default ChildCard;
