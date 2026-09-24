import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Calendar, User, CreditCard, Hospital, AlertCircle, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { childrenAPI } from '@/lib/api';
import { generateCertificatePDF } from '@/lib/certificateGenerator';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';

interface VerificationData {
  childId: string;
  name: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  maskedAbhaId: string;
  guardianName: string;
  doctor: {
    name: string;
    doctorId: string;
    hospitalName?: string;
  } | null;
  totalVaccines: number;
  completedCount: number;
  completedVaccines: Array<{
    vaccineId: string;
    name: string;
    shortName: string;
    doseNumber: number;
    administeredDate: string;
    phase: number;
  }>;
  verifiedAt: string;
  status: string;
}

const VerifyCertificate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      if (!id) {
        setError('Missing certificate reference identifier.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await childrenAPI.verifyCertificate(id);
        setData(res);
      } catch (err: any) {
        console.error('Verification failed:', err);
        setError(err.message || 'Unable to authenticate certificate. The record may not exist or has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [id]);

  const handleDownload = async () => {
    if (!data) return;
    try {
      setIsDownloading(true);
      await generateCertificatePDF({
        id: data.childId,
        name: data.name,
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth),
        abhaId: data.maskedAbhaId,
        guardianName: data.guardianName,
        doctorName: data.doctor?.name,
        hospitalName: data.doctor?.hospitalName,
        schedule: data.completedVaccines.map(v => ({
          ...v,
          dueDate: new Date(),
          status: 'COMPLETED',
          series: v.shortName,
        })),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight font-display">VacciTrack</span>
              <span className="text-[10px] block text-muted-foreground uppercase tracking-widest font-mono">
                Verification Registry
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Authenticating certificate against NIS registry...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl border border-destructive/30 bg-destructive/5 text-center max-w-lg mx-auto"
          >
            <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Certificate Not Verified</h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Return to VacciTrack Portal
              </Button>
            </Link>
          </motion.div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Verified Header Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 border border-emerald-500/30 text-center relative overflow-hidden shadow-lg shadow-emerald-500/5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mb-2">
                Official Record Verified
              </span>
              <h1 className="text-2xl font-bold font-display text-foreground">
                Vaccination Record Authenticated
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                This certificate is verified by VacciTrack UIP Registry in full compliance with National Immunization Schedule (NIS 2025).
              </p>
              <div className="text-[11px] font-mono text-emerald-500/80 mt-3">
                Verified at: {format(new Date(data.verifiedAt), 'dd MMM yyyy, hh:mm:ss a')}
              </div>
            </div>

            {/* Beneficiary Card */}
            <div className="card-medical p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                Beneficiary Identification
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-primary" /> Beneficiary Name
                  </span>
                  <span className="font-bold text-base text-foreground block">{data.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {data.gender} • Born {format(new Date(data.dateOfBirth), 'dd MMM yyyy')}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-primary" /> ABHA ID (Masked)
                  </span>
                  <span className="font-mono font-bold text-base text-foreground block">
                    {data.maskedAbhaId}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Guardian: {data.guardianName}
                  </span>
                </div>
              </div>

              {data.doctor && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Hospital className="w-4 h-4 text-primary" />
                    <div>
                      <span className="font-medium text-foreground block">
                        Dr. {data.doctor.name} ({data.doctor.doctorId})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {data.doctor.hospitalName || 'Universal Immunization Centre'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                    Assigned Medical Officer
                  </span>
                </div>
              )}
            </div>

            {/* Immunization History Table */}
            <div className="card-medical p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Verified Immunization Log
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {data.completedCount} of {data.totalVaccines} NIS vaccines administered via OTP
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {data.status}
                </span>
              </div>

              <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
                {data.completedVaccines.length > 0 ? (
                  data.completedVaccines.map((v, i) => (
                    <div key={v.vaccineId || i} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{v.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.shortName} • Dose {v.doseNumber} (Phase {v.phase})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-medium text-foreground block">
                          {v.administeredDate ? format(new Date(v.administeredDate), 'dd-MMM-yyyy') : 'Administered'}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                          OTP Authenticated
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No completed vaccines on record yet.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to VacciTrack Portal
                </Button>
              </Link>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-2 text-xs"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Generating PDF...' : 'Download Official PDF Certificate'}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © 2026 VacciTrack • National Immunization Schedule 2025 Verification Authority
      </footer>
    </div>
  );
};

export default VerifyCertificate;
