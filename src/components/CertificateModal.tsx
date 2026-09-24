import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ShieldCheck, QrCode, CheckCircle2, Building, User, Calendar, ExternalLink, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { generateCertificatePDF, CertificateData } from '@/lib/certificateGenerator';
import { toast } from 'sonner';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: CertificateData;
}

const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, child }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  const completedVaccines = (child.schedule || []).filter(v => v.status === 'COMPLETED');
  const totalVaccines = (child.schedule || []).length;
  const isFullyImmunized = completedVaccines.length > 0 && completedVaccines.length === totalVaccines;

  const dobDate = child.dateOfBirth instanceof Date ? child.dateOfBirth : new Date(child.dateOfBirth);
  const formattedDob = !isNaN(dobDate.getTime()) ? format(dobDate, 'dd MMM yyyy') : 'N/A';
  const formattedAbha = child.abhaId
    ? child.abhaId.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim()
    : 'N/A';

  useEffect(() => {
    if (isOpen && child.id) {
      const verifyUrl = `${window.location.origin}/verify/${child.id}`;
      QRCode.toDataURL(verifyUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch(err => console.error('Failed to create preview QR:', err));
    }
  }, [isOpen, child.id]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await generateCertificatePDF(child);
      toast.success('Certificate downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate PDF certificate');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-border bg-card">
        {/* Certificate Card Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white p-6 relative overflow-hidden rounded-t-lg">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/15 rounded-lg backdrop-blur-md">
                <ShieldCheck className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-teal-100">Ministry of Health & Family Welfare</span>
                <p className="text-xs text-teal-200">Universal Immunization Programme • NIS 2025</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/25 border border-emerald-300/40 rounded-full text-xs font-semibold text-emerald-100 backdrop-blur-md">
              OTP Verified
            </span>
          </div>

          <h2 className="text-2xl font-bold font-display text-white tracking-tight">
            Digital Certificate for Child Immunization
          </h2>
          <p className="text-sm text-teal-100 mt-1">
            Government of India NIS-compliant verifiable medical record
          </p>
        </div>

        {/* Certificate Card Body */}
        <div className="p-6 space-y-6">
          {/* Top Info Grid + QR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-muted/40 p-4 rounded-xl border border-border/60">
            {/* Beneficiary Details */}
            <div className="md:col-span-2 space-y-2 text-sm">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" /> Beneficiary Name
                </span>
                <span className="font-bold text-foreground text-base">{child.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" /> Date of Birth
                </span>
                <span className="font-medium text-foreground">{formattedDob} ({child.gender.toUpperCase()})</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">ABHA ID</span>
                <span className="font-mono font-bold text-primary">{formattedAbha}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vaccination Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {isFullyImmunized ? 'Fully Immunized' : `Partially Immunized (${completedVaccines.length}/${totalVaccines})`}
                </span>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="flex flex-col items-center justify-center p-3 bg-background rounded-lg border border-border text-center shadow-xs">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Certificate Verification QR" className="w-28 h-28 object-contain rounded" />
              ) : (
                <div className="w-28 h-28 bg-muted animate-pulse rounded flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <span className="text-[10px] font-bold text-primary mt-1.5 uppercase tracking-wide">
                Scan to Authenticate
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">
                VT-{child.id.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Administered Vaccines Summary */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                Administered Doses ({completedVaccines.length})
              </h3>
              <span className="text-xs text-muted-foreground">
                All records 2FA OTP Verified
              </span>
            </div>

            {completedVaccines.length > 0 ? (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                {completedVaccines.map((v, i) => (
                  <div key={v.vaccineId || i} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{v.name} ({v.shortName})</p>
                        <p className="text-xs text-muted-foreground">Dose {v.doseNumber} • Phase {v.phase}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {v.administeredDate ? format(new Date(v.administeredDate), 'dd MMM yyyy') : 'Completed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed rounded-lg text-muted-foreground text-sm">
                No vaccines marked as completed yet. Once a doctor administers doses via OTP, they will appear here.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <a
              href={`${window.location.origin}/verify/${child.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Test Public Verification Link <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Generating PDF...' : 'Download Official PDF'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateModal;
