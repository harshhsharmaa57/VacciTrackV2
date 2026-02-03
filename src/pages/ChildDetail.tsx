import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, Download, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import VaccineTimeline from '@/components/VaccineTimeline';
import ShieldBadge from '@/components/ShieldBadge';
import { useLanguage } from '@/context/LanguageContext';
import { childrenAPI } from '@/lib/api';
import { MASTER_VACCINE_SCHEDULE } from '@/lib/vaccineSchedule';
import { cn } from '@/lib/utils';

interface Child {
  _id?: string;
  id?: string;
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
  abhaId: string;
  schedule: any[];
}

const ChildDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [child, setChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChild = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const childData = await childrenAPI.getById(id);
        // Normalize child data
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
        setChild(normalizedChild);
      } catch (error: any) {
        console.error('Failed to load child:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChild();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading child details...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Child not found</h1>
          <button
            onClick={() => navigate('/parent')}
            className="btn-medical"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const completedCount = child.schedule.filter(v => v.status === 'COMPLETED').length;
  const totalCount = MASTER_VACCINE_SCHEDULE.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/parent')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-medical p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Child Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
                  child.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                )}>
                  {child.name.charAt(0)}
                </div>
                <div>
                  <h1 className="font-display font-bold text-2xl text-foreground">
                    {child.name}
                  </h1>
                  <p className="text-muted-foreground capitalize">{child.gender}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Born: {format(child.dateOfBirth, 'dd MMMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span>ABHA: {child.abhaId.replace(/(\d{4})/g, '$1 ').trim()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                  <Download className="w-4 h-4" />
                  Download Certificate
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

            {/* Shield Badge */}
            <div className="flex-shrink-0">
              <ShieldBadge
                completedCount={completedCount}
                totalCount={totalCount}
                size="lg"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="card-medical p-4 text-center">
            <p className="text-3xl font-bold text-success">
              {child.schedule.filter(v => v.status === 'COMPLETED').length}
            </p>
            <p className="text-sm text-muted-foreground">{t('completed')}</p>
          </div>
          <div className="card-medical p-4 text-center">
            <p className="text-3xl font-bold text-warning">
              {child.schedule.filter(v => v.status === 'PENDING').length}
            </p>
            <p className="text-sm text-muted-foreground">{t('pending')}</p>
          </div>
          <div className="card-medical p-4 text-center">
            <p className="text-3xl font-bold text-destructive">
              {child.schedule.filter(v => v.status === 'OVERDUE').length}
            </p>
            <p className="text-sm text-muted-foreground">{t('overdue')}</p>
          </div>
          <div className="card-medical p-4 text-center">
            <p className="text-3xl font-bold text-muted-foreground">
              {child.schedule.filter(v => v.status === 'UPCOMING').length}
            </p>
            <p className="text-sm text-muted-foreground">{t('upcoming')}</p>
          </div>
        </motion.div>

        {/* Vaccine Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display font-semibold text-xl text-foreground mb-6">
            {t('vaccineTimeline')}
          </h2>
          <VaccineTimeline schedule={child.schedule} />
        </motion.div>
      </main>
    </div>
  );
};

export default ChildDetail;
