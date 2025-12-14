import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Syringe, CheckCircle, AlertTriangle, Clock, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import ChildCard from '@/components/ChildCard';
import StatsCard from '@/components/StatsCard';
import VaccineTimeline from '@/components/VaccineTimeline';
import ConfettiExplosion from '@/components/ConfettiExplosion';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { childRepository, Child } from '@/lib/dataStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Get all children (doctors can see all)
  const allChildren = childRepository.findAll();

  // Filter by search
  const filteredChildren = searchQuery
    ? childRepository.searchByName(searchQuery)
    : allChildren;

  // Calculate aggregate stats
  const totalStats = allChildren.reduce(
    (acc, child) => {
      child.schedule.forEach(v => {
        if (v.status === 'COMPLETED') acc.completed++;
        else if (v.status === 'PENDING') acc.pending++;
        else if (v.status === 'OVERDUE') acc.overdue++;
      });
      return acc;
    },
    { completed: 0, pending: 0, overdue: 0 }
  );

  const handleAdminister = (vaccineId: string) => {
    if (!selectedChild) return;

    childRepository.updateVaccineStatus(selectedChild.id, vaccineId, 'COMPLETED');

    // Refresh the selected child data
    const updatedChild = childRepository.findById(selectedChild.id);
    if (updatedChild) {
      setSelectedChild(updatedChild);
    }

    // Show confetti
    setShowConfetti(true);

    toast.success(t('congratulations'), {
      description: t('vaccineCompleted'),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ConfettiExplosion trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display font-bold text-3xl text-foreground">
              Healthcare Provider Portal
            </h1>
            <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
              Doctor
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span>{user?.hospitalName || 'Healthcare Facility'}</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Patients"
            value={allChildren.length}
            icon={Users}
            delay={0}
          />
          <StatsCard
            title="Vaccines Given"
            value={totalStats.completed}
            icon={CheckCircle}
            variant="success"
            delay={0.1}
          />
          <StatsCard
            title="Pending Today"
            value={totalStats.pending}
            icon={Clock}
            variant="warning"
            delay={0.2}
          />
          <StatsCard
            title="Overdue Cases"
            value={totalStats.overdue}
            icon={AlertTriangle}
            variant="danger"
            delay={0.3}
          />
        </div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="card-medical p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Search by child name or ABHA ID..."
              />
            </div>
          </div>
        </motion.div>

        {/* Patient List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-display font-semibold text-xl text-foreground mb-4">
            {searchQuery ? `Search Results (${filteredChildren.length})` : t('patientList')}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChildren.map((child) => (
              <motion.div
                key={child.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChild(child)}
                className="card-medical p-4 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    child.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                  }`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{child.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      ABHA: {child.abhaId.substring(0, 4)}...{child.abhaId.substring(10)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      DOB: {format(child.dateOfBirth, 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-success">{child.schedule.filter(v => v.status === 'COMPLETED').length}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">{child.schedule.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">completed</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-success">
                      {child.schedule.filter(v => v.status === 'COMPLETED').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-warning">
                      {child.schedule.filter(v => v.status === 'PENDING').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-destructive">
                      {child.schedule.filter(v => v.status === 'OVERDUE').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Patient Detail Modal */}
      <Dialog open={!!selectedChild} onOpenChange={() => setSelectedChild(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Syringe className="w-5 h-5 text-primary" />
              Patient Record: {selectedChild?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedChild && (
            <div className="mt-4">
              {/* Patient Info */}
              <div className="card-medical p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-semibold">{selectedChild.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">DOB</p>
                    <p className="font-semibold">{format(selectedChild.dateOfBirth, 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-semibold capitalize">{selectedChild.gender}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ABHA ID</p>
                    <p className="font-mono text-xs">{selectedChild.abhaId}</p>
                  </div>
                </div>
              </div>

              {/* Vaccination Timeline */}
              <h3 className="font-semibold text-lg mb-4">{t('vaccineTimeline')}</h3>
              <VaccineTimeline
                schedule={selectedChild.schedule}
                onAdminister={handleAdminister}
                isDoctor={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;
