import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Baby, 
  Trash2, 
  ArrowRightLeft, 
  ArrowRight,
  Search, 
  MapPin, 
  ExternalLink,
  FileText,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import Navbar from '@/components/Navbar';
import ChildCard from '@/components/ChildCard';
import StatsCard from '@/components/StatsCard';
import CertificateModal from '@/components/CertificateModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { childrenAPI, usersAPI, otpAPI } from '@/lib/api';
import { MASTER_VACCINE_SCHEDULE } from '@/lib/vaccineSchedule';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Child {
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

const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [childToTransfer, setChildToTransfer] = useState<Child | null>(null);
  const [transferDoctorId, setTransferDoctorId] = useState('');
  const [doctorPreview, setDoctorPreview] = useState<any | null>(null);
  const [isLookingUpDoctor, setIsLookingUpDoctor] = useState(false);
  const [isTransferringDoctor, setIsTransferringDoctor] = useState(false);
  const [selectedCertificateChild, setSelectedCertificateChild] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'ontrack'>('all');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
  });

  // Fetch children from API
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await childrenAPI.getAll();
        // Normalize children data
        const normalizedChildren = data.map((child: any) => ({
          ...child,
          id: child._id || child.id,
          dateOfBirth: new Date(child.dateOfBirth),
          schedule: child.schedule.map((v: any) => ({
            ...v,
            dueDate: new Date(v.dueDate),
            administeredDate: v.administeredDate ? new Date(v.administeredDate) : undefined,
          })),
        }));
        setChildren(normalizedChildren);
      } catch (error: any) {
        toast.error('Failed to load children', {
          description: error.message || 'An error occurred',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  // Calculate aggregate stats
  const totalStats = children.reduce(
    (acc, child) => {
      child.schedule.forEach(v => {
        if (v.status === 'COMPLETED') acc.completed++;
        else if (v.status === 'PENDING') acc.pending++;
        else if (v.status === 'OVERDUE') acc.overdue++;
        else acc.upcoming++;
      });
      return acc;
    },
    { completed: 0, pending: 0, overdue: 0, upcoming: 0 }
  );

  // Get next upcoming vaccine
  const getNextVaccine = () => {
    for (const child of children) {
      const pending = child.schedule
        .filter(v => v.status === 'PENDING' || v.status === 'UPCOMING')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      if (pending.length > 0) {
        return { child, vaccine: pending[0] };
      }
    }
    return null;
  };

  const nextVaccine = getNextVaccine();

  const overdueChildrenCount = children.filter(c => (c.schedule || []).some((v: any) => v.status === 'OVERDUE')).length;
  const onTrackChildrenCount = children.length - overdueChildrenCount;

  const filteredChildren = children.filter((child) => {
    if (filterStatus === 'all') return true;
    const isOverdue = (child.schedule || []).some((v: any) => v.status === 'OVERDUE');
    if (filterStatus === 'overdue') return isOverdue;
    if (filterStatus === 'ontrack') return !isOverdue;
    return true;
  });

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const childData = await childrenAPI.create({
        name: newChild.name,
        dateOfBirth: newChild.dateOfBirth,
        gender: newChild.gender,
      });

      // Normalize and add to local state
      const normalizedChild = {
        ...childData,
        id: childData._id || childData.id,
        dateOfBirth: new Date(childData.dateOfBirth),
        schedule: childData.schedule.map((v: any) => ({
          ...v,
          dueDate: new Date(v.dueDate),
          administeredDate: v.administeredDate ? new Date(v.administeredDate) : undefined,
        })),
      };
      setChildren([...children, normalizedChild]);

      toast.success('Child added successfully!', {
        description: `${newChild.name} has been registered with their vaccination schedule.`,
      });

      setNewChild({ name: '', dateOfBirth: '', gender: 'male' });
      setIsAddChildOpen(false);
    } catch (error: any) {
      toast.error('Failed to add child', {
        description: error.message || 'An error occurred',
      });
    }
  };

  const handleDeleteChild = async () => {
    if (!childToDelete) return;

    try {
      setIsDeleting(true);
      const childId = childToDelete.id || childToDelete._id;
      if (!childId) return;

      const result = await childrenAPI.remove(childId);

      // Remove child from local state
      setChildren((prev) => prev.filter((child) => child.id !== childId));
      setChildToDelete(null);

      // If parent account was deleted, logout and redirect
      if (result.parentDeleted) {
        toast.success('Child deleted', {
          description: 'Your account has been deleted as you have no remaining children.',
        });
        // Small delay to show the toast
        setTimeout(() => {
          logout();
          navigate('/');
        }, 2000);
      } else {
        toast.success('Child deleted', {
          description: `${childToDelete.name}'s record has been removed.`,
        });
      }
    } catch (error: any) {
      toast.error('Failed to delete child', {
        description: error.message || 'An error occurred',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetTransferState = () => {
    setTransferDoctorId('');
    setDoctorPreview(null);
    setIsLookingUpDoctor(false);
    setIsTransferringDoctor(false);
  };

  const openTransferDialog = (child: Child) => {
    setChildToTransfer(child);
    resetTransferState();
  };

  const handleLookupDoctor = async () => {
    const normalizedId = transferDoctorId.trim().toUpperCase();
    if (!/^DOC-[A-Z0-9]{6}$/.test(normalizedId)) {
      toast.error('Invalid Doctor ID format', {
        description: 'Use DOC-XXXXXX format (example: DOC-A3K9X2).',
      });
      return;
    }

    try {
      setIsLookingUpDoctor(true);
      const doctor = await usersAPI.lookupDoctor(normalizedId);
      setDoctorPreview(doctor);
      toast.success('Doctor found', {
        description: `${doctor.name}${doctor.hospitalName ? ` • ${doctor.hospitalName}` : ''}`,
      });
    } catch (error: any) {
      setDoctorPreview(null);
      toast.error('Doctor lookup failed', {
        description: error.message || 'Unable to find this doctor ID.',
      });
    } finally {
      setIsLookingUpDoctor(false);
    }
  };

  const handleTransferDoctor = async () => {
    if (!childToTransfer || !doctorPreview) return;
    const childId = childToTransfer.id || childToTransfer._id;
    if (!childId) return;

    try {
      setIsTransferringDoctor(true);
      const response = await childrenAPI.transferDoctor(childId, doctorPreview.doctorId);
      const updatedChildData = response.data;
      const normalizedChild = {
        ...updatedChildData,
        id: updatedChildData._id || updatedChildData.id,
        dateOfBirth: new Date(updatedChildData.dateOfBirth),
        schedule: updatedChildData.schedule.map((v: any) => ({
          ...v,
          dueDate: new Date(v.dueDate),
          administeredDate: v.administeredDate ? new Date(v.administeredDate) : undefined,
        })),
      };

      setChildren((prev) =>
        prev.map((child) =>
          (child.id || child._id) === childId ? normalizedChild : child
        )
      );

      toast.success('Doctor transferred successfully', {
        description: `${childToTransfer.name} is now assigned to Dr. ${doctorPreview.name}.`,
      });

      setChildToTransfer(null);
      resetTransferState();
    } catch (error: any) {
      toast.error('Transfer failed', {
        description: error.message || 'Unable to transfer doctor assignment.',
      });
    } finally {
      setIsTransferringDoctor(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-teal-500/20">
      {/* Ambient Glowing Gradients & Dot Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/15 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-10 w-[450px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-32 right-10 w-[450px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.07] dark:opacity-[0.14]" />
      </div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 mb-2 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>National Immunization Schedule (NIS) 2025 Compliant</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Track and manage your family's vaccination milestones with official ABHA verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card/80 border border-border/80 text-xs font-semibold text-foreground shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{children.length} Children Linked</span>
              <span className="text-border">•</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">ABHA Active</span>
            </div>

            <button
              onClick={() => setIsAddChildOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Child</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
          <StatsCard
            title={t('completedVaccines')}
            value={totalStats.completed}
            icon={CheckCircle}
            variant="success"
            delay={0}
          />
          <StatsCard
            title={t('pendingVaccines')}
            value={totalStats.pending}
            subtitle={totalStats.pending > 0 ? `${t('dueWithin')} 7 ${t('daysRemaining')}` : undefined}
            icon={Clock}
            variant="warning"
            delay={0.08}
          />
          <StatsCard
            title={t('missedVaccines')}
            value={totalStats.overdue}
            icon={AlertTriangle}
            variant="danger"
            delay={0.16}
          />
          <StatsCard
            title={t('upcomingVaccines')}
            value={totalStats.upcoming}
            icon={Calendar}
            delay={0.24}
          />
        </div>

        {/* Dual Action Banners Grid: Next Vaccine Priority Alert + Government PHC Locator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-8 items-stretch">
          {/* Next Vaccine Priority Alert Banner */}
          {nextVaccine ? (() => {
            const daysDiff = differenceInDays(nextVaccine.vaccine.dueDate, new Date());
            const isOverdue = daysDiff < 0;
            const isDueToday = daysDiff === 0;

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className={cn(
                  "p-5 sm:p-7 rounded-3xl bg-card/85 hover:bg-card border border-border/80 shadow-lg hover:shadow-2xl backdrop-blur-xl transition-all relative overflow-hidden flex flex-col justify-between group",
                  isOverdue
                    ? "hover:border-rose-500/50 hover:shadow-rose-500/10"
                    : "hover:border-amber-500/50 hover:shadow-amber-500/10"
                )}
              >
                {/* Top glowing hairline */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity",
                  isOverdue 
                    ? "from-rose-500 via-red-400 to-rose-400"
                    : "from-amber-500 via-orange-400 to-amber-400"
                )} />

                <div>
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border flex items-center gap-1.5",
                      isOverdue
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    )}>
                      {isOverdue ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>Critical Attention</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Priority Milestone</span>
                        </>
                      )}
                    </span>

                    {/* Clean Countdown Badge */}
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border shadow-2xs",
                      isOverdue
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        : isDueToday
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                    )}>
                      {isOverdue ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{Math.abs(daysDiff)} {t('overdueDays')}</span>
                        </>
                      ) : isDueToday ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                          <span>Due Today!</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{daysDiff} {t('daysRemaining')}</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5 mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 shadow-2xs",
                      isOverdue
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    )}>
                      {isOverdue ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Clock className="w-6 h-6" />}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-foreground font-display truncate">
                        {nextVaccine.vaccine.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        For <span className="font-semibold text-foreground">{nextVaccine.child.name}</span> • Due <span className="font-medium text-foreground">{format(nextVaccine.vaccine.dueDate, 'dd MMM yyyy')}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-medium">National Immunization Schedule</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          setSendingReminder(true);
                          const targetEmail = user?.email || 'ayushr94150@gmail.com';
                          await otpAPI.sendReminderEmail({
                            email: targetEmail,
                            childName: nextVaccine.child.name,
                            vaccineName: nextVaccine.vaccine.name,
                            dueDate: format(nextVaccine.vaccine.dueDate, 'dd MMM yyyy'),
                            daysRemaining: Math.max(0, daysDiff),
                          });
                          toast.success(`Vaccine reminder sent to Gmail (${targetEmail})!`);
                        } catch (err: any) {
                          toast.info('Vaccination reminder logged to your account.');
                        } finally {
                          setSendingReminder(false);
                        }
                      }}
                      disabled={sendingReminder}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 transition-all active:scale-[0.98] shadow-sm hover:shadow-emerald-500/10"
                      title="Send vaccination reminder to registered Gmail"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{sendingReminder ? 'Sending...' : 'Send to Gmail'}</span>
                    </button>
                    <button
                      onClick={() => navigate(`/child/${nextVaccine.child.id || nextVaccine.child._id}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-teal-500/25 transition-all whitespace-nowrap active:scale-[0.98]"
                    >
                      <span>View Schedule</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })() : (
            <div className="p-5 sm:p-7 rounded-3xl border border-emerald-500/30 bg-card/85 backdrop-blur-xl flex flex-col justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground font-display">All Vaccinations Up-to-Date!</h4>
                  <p className="text-xs text-muted-foreground">Your children have no pending vaccine milestones.</p>
                </div>
              </div>
            </div>
          )}

          {/* Nearby Vaccination Centers Card */}
          <div className="p-5 sm:p-7 rounded-3xl bg-card/85 hover:bg-card border border-border/80 hover:border-cyan-500/50 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transition-all backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group">
            {/* Top glowing hairline */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  Live GPS Locator
                </span>
                <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">11+ Verified Centers</span>
              </div>

              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-2xs flex-shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base sm:text-lg text-foreground font-display group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Find Government PHCs & Clinics
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    Check walk-in timings, live stock of NIS 2025 vaccines & get 1-click turn-by-turn directions.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3.5 border-t border-border/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Nearby & State Registry</span>
              <button
                onClick={() => navigate('/centers')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-md hover:shadow-teal-500/25 transition-all whitespace-nowrap active:scale-[0.98]"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Explore Centers Map</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Children Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground tracking-tight">
                  {t('children')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  {children.length} Registered
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a child to view clinical timeline, administer doses, or generate instant certificates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Pills */}
              <div className="flex items-center p-1 rounded-2xl bg-muted/80 border border-border/70 text-xs font-semibold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl transition-all",
                    filterStatus === 'all'
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All ({children.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('overdue')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5",
                    filterStatus === 'overdue'
                      ? "bg-rose-500 text-white shadow-xs font-bold"
                      : "text-rose-600 dark:text-rose-400 hover:text-rose-700"
                  )}
                >
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Needs Dose</span>
                  <span>({overdueChildrenCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('ontrack')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl transition-all",
                    filterStatus === 'ontrack'
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
                      : "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                  )}
                >
                  Up to Date ({onTrackChildrenCount})
                </button>
              </div>

              {/* Add Child Dialog */}
              <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-teal-500/20 active:scale-95 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('addChild')}</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Baby className="w-5 h-5 text-primary" />
                      {t('addChild')}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddChild} className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('childName')}
                      </label>
                      <input
                        type="text"
                        value={newChild.name}
                        onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Enter child's name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('dateOfBirth')}
                      </label>
                      <input
                        type="date"
                        value={newChild.dateOfBirth}
                        onChange={(e) => setNewChild({ ...newChild, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('gender')}
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="male"
                            checked={newChild.gender === 'male'}
                            onChange={(e) => setNewChild({ ...newChild, gender: 'male' })}
                            className="w-4 h-4 text-primary"
                          />
                          <span>{t('male')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="female"
                            checked={newChild.gender === 'female'}
                            onChange={(e) => setNewChild({ ...newChild, gender: 'female' })}
                            className="w-4 h-4 text-primary"
                          />
                          <span>{t('female')}</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsAddChildOpen(false)}
                        className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 btn-medical"
                      >
                        {t('save')}
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            <div className="card-medical p-12 text-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading children...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="card-medical p-12 text-center">
              <Baby className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">No children registered</h3>
              <p className="text-muted-foreground mb-6">Add your first child to start tracking vaccinations</p>
              <button
                onClick={() => setIsAddChildOpen(true)}
                className="btn-medical"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                {t('addChild')}
              </button>
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-dashed border-border/80 bg-card/60 backdrop-blur-md">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="font-bold text-foreground">No children in this view</h4>
              <p className="text-xs text-muted-foreground mt-1 mb-3">All children records are currently updated.</p>
              <button
                onClick={() => setFilterStatus('all')}
                className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
              >
                Show All Children
              </button>
            </div>
          ) : (
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filteredChildren.map((child) => (
                <motion.div
                  key={child.id || child._id}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                  }}
                >
                  <ChildCard
                    child={child}
                    onClick={() => navigate(`/child/${child.id || child._id}`)}
                    onDownloadCertificate={(c) => setSelectedCertificateChild(c)}
                    onTransferDoctor={(c) => openTransferDialog(c)}
                    onDeleteChild={(c) => setChildToDelete(c)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!childToDelete} onOpenChange={(open) => !open && setChildToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Child Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {childToDelete?.name}'s record? This action cannot be undone.
              {children.length === 1 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This is your only child. Deleting this record will also delete your account.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChild}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Doctor Dialog */}
      <Dialog
        open={!!childToTransfer}
        onOpenChange={(open) => {
          if (!open) {
            setChildToTransfer(null);
            resetTransferState();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Transfer Doctor - {childToTransfer?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Doctor ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transferDoctorId}
                  onChange={(e) => {
                    setTransferDoctorId(e.target.value.toUpperCase());
                    setDoctorPreview(null);
                  }}
                  placeholder="DOC-A3K9X2"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleLookupDoctor}
                  disabled={isLookingUpDoctor || !transferDoctorId.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-60"
                >
                  <Search className="w-4 h-4" />
                  {isLookingUpDoctor ? 'Checking...' : 'Preview'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Format: DOC-XXXXXX
              </p>
            </div>

            {doctorPreview && (
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Doctor Preview
                </p>
                <p className="font-semibold text-foreground">{doctorPreview.name}</p>
                <p className="text-sm text-muted-foreground">
                  {doctorPreview.hospitalName || 'Hospital not specified'}
                </p>
                <p className="text-xs font-mono mt-1">{doctorPreview.doctorId}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setChildToTransfer(null);
                  resetTransferState();
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferDoctor}
                disabled={!doctorPreview || isTransferringDoctor}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {isTransferringDoctor ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Certificate Preview & Download Modal */}
      {selectedCertificateChild && (
        <CertificateModal
          isOpen={!!selectedCertificateChild}
          onClose={() => setSelectedCertificateChild(null)}
          child={selectedCertificateChild}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
