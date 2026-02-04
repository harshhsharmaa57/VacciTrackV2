import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, AlertTriangle, Clock, Plus, Baby, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import Navbar from '@/components/Navbar';
import ChildCard from '@/components/ChildCard';
import StatsCard from '@/components/StatsCard';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { childrenAPI } from '@/lib/api';
import { MASTER_VACCINE_SCHEDULE } from '@/lib/vaccineSchedule';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

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

const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Track and manage your children's immunization records
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            subtitle="Due within 7 days"
            icon={Clock}
            variant="warning"
            delay={0.1}
          />
          <StatsCard
            title={t('missedVaccines')}
            value={totalStats.overdue}
            icon={AlertTriangle}
            variant="danger"
            delay={0.2}
          />
          <StatsCard
            title={t('upcomingVaccines')}
            value={totalStats.upcoming}
            icon={Calendar}
            delay={0.3}
          />
        </div>

        {/* Next Vaccine Alert */}
        {nextVaccine && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-medical p-6 mb-8 border-l-4 border-l-warning"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {t('nextVaccineDue')}: {nextVaccine.vaccine.name}
                </h3>
                <p className="text-muted-foreground mb-2">
                  For {nextVaccine.child.name} • Due {format(nextVaccine.vaccine.dueDate, 'dd MMM yyyy')}
                </p>
                <p className="text-sm">
                  {differenceInDays(nextVaccine.vaccine.dueDate, new Date()) >= 0 ? (
                    <span className="text-warning font-medium">
                      {differenceInDays(nextVaccine.vaccine.dueDate, new Date())} {t('daysRemaining')}
                    </span>
                  ) : (
                    <span className="text-destructive font-medium">
                      {Math.abs(differenceInDays(nextVaccine.vaccine.dueDate, new Date()))} {t('overdueDays')}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => navigate(`/child/${nextVaccine.child.id}`)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                {t('viewSchedule')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Children Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-xl text-foreground">
              {t('children')}
            </h2>
            <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                  <Plus className="w-4 h-4" />
                  {t('addChild')}
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
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {children.map((child) => (
                <div key={child.id} className="relative group">
                  <ChildCard
                    child={child}
                    onClick={() => navigate(`/child/${child.id}`)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChildToDelete(child);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                    title="Delete child"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
    </div>
  );
};

export default ParentDashboard;
