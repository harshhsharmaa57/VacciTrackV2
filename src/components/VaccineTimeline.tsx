import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { CheckCircle, Clock, AlertTriangle, Calendar, Syringe } from 'lucide-react';
import { ScheduledVaccine } from '@/lib/vaccineSchedule';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface VaccineTimelineProps {
  schedule: ScheduledVaccine[];
  onAdminister?: (vaccineId: string) => void;
  isDoctor?: boolean;
}

const VaccineTimeline: React.FC<VaccineTimelineProps> = ({ schedule, onAdminister, isDoctor }) => {
  const groupedByPhase = schedule.reduce((acc, vaccine) => {
    if (!acc[vaccine.phase]) {
      acc[vaccine.phase] = [];
    }
    acc[vaccine.phase].push(vaccine);
    return acc;
  }, {} as Record<number, ScheduledVaccine[]>);

  const phaseLabels: Record<number, string> = {
    1: 'Birth Window (0-15 Days)',
    2: 'Primary Series (6-14 Weeks)',
    3: 'Measles & Boosters (9-24 Months)',
    4: 'Lifecycle Extensions (5-16 Years)',
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'OVERDUE':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default:
        return <Calendar className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'status-completed';
      case 'PENDING':
        return 'status-pending';
      case 'OVERDUE':
        return 'status-overdue';
      default:
        return 'status-upcoming';
    }
  };

  const getDaysInfo = (vaccine: ScheduledVaccine) => {
    if (vaccine.status === 'COMPLETED') return null;
    const days = differenceInDays(vaccine.dueDate, new Date());
    if (days > 0) return `Due in ${days} days`;
    if (days === 0) return 'Due today!';
    return `${Math.abs(days)} days overdue`;
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedByPhase).map(([phase, vaccines], phaseIndex) => (
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: phaseIndex * 0.1 }}
          className="relative"
        >
          {/* Phase Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold">
              {phase}
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              {phaseLabels[Number(phase)]}
            </h3>
          </div>

          {/* Timeline Items */}
          <div className="relative pl-12">
            {/* Vertical Line */}
            <div className="timeline-line" />

            <div className="space-y-4">
              {vaccines.map((vaccine, index) => (
                <motion.div
                  key={vaccine.vaccineId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: phaseIndex * 0.1 + index * 0.05 }}
                  className={cn(
                    'relative card-medical p-4',
                    vaccine.status === 'OVERDUE' && 'animate-shake border-destructive/30'
                  )}
                >
                  {/* Timeline Dot */}
                  <div
                    className={cn(
                      'absolute -left-6 w-4 h-4 rounded-full border-2 border-card',
                      vaccine.status === 'COMPLETED' && 'bg-success',
                      vaccine.status === 'PENDING' && 'bg-warning pulse-dot',
                      vaccine.status === 'OVERDUE' && 'bg-destructive',
                      vaccine.status === 'UPCOMING' && 'bg-muted-foreground'
                    )}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(vaccine.status)}
                        <h4 className="font-semibold text-foreground">{vaccine.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {vaccine.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={cn('px-2 py-1 rounded-full', getStatusClass(vaccine.status))}>
                          {vaccine.status}
                        </span>
                        <span className="text-muted-foreground">
                          Due: {format(vaccine.dueDate, 'dd MMM yyyy')}
                        </span>
                        {vaccine.administeredDate && (
                          <span className="text-success">
                            Given: {format(vaccine.administeredDate, 'dd MMM yyyy')}
                          </span>
                        )}
                        {getDaysInfo(vaccine) && (
                          <span className={cn(
                            'font-medium',
                            vaccine.status === 'OVERDUE' ? 'text-destructive' : 'text-warning'
                          )}>
                            {getDaysInfo(vaccine)}
                          </span>
                        )}
                      </div>
                    </div>

                    {isDoctor && vaccine.status !== 'COMPLETED' && onAdminister && (
                      <button
                        onClick={() => onAdminister(vaccine.vaccineId)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <Syringe className="w-4 h-4" />
                        Administer
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default VaccineTimeline;
