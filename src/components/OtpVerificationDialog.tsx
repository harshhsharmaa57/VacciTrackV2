import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle, Loader2, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { otpAPI } from '@/lib/api';

interface OtpVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  vaccineId: string;
  vaccineName: string;
  childName: string;
  onVerified: (updatedChildData: any) => void;
}

type OtpStage = 'sending' | 'input' | 'verifying' | 'success' | 'error';

const OtpVerificationDialog: React.FC<OtpVerificationDialogProps> = ({
  open,
  onOpenChange,
  childId,
  vaccineId,
  vaccineName,
  childName,
  onVerified,
}) => {
  const [stage, setStage] = useState<OtpStage>('sending');
  const [otp, setOtp] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [expiresIn, setExpiresIn] = useState(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState(''); // For dev mode display

  // Send OTP on dialog open
  useEffect(() => {
    if (open) {
      setOtp('');
      setError('');
      setAttemptsRemaining(null);
      setDevOtp('');
      sendOtp();
    }
  }, [open, childId, vaccineId]);

  // Expiry countdown timer
  useEffect(() => {
    if (stage !== 'input' || expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('OTP has expired. Please request a new one.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, expiresIn]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOtp = async () => {
    setStage('sending');
    setError('');

    try {
      const response = await otpAPI.send(childId, vaccineId);
      setPhoneDisplay(response.phoneLastFour || '******');
      setExpiresIn(response.expiresIn || 300);
      setResendCooldown(60);
      if (response.devOtp) {
        setDevOtp(response.devOtp);
      }
      setStage('input');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      setStage('error');
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setStage('verifying');
    setError('');

    try {
      const response = await otpAPI.verify(childId, vaccineId, otp);
      setStage('success');

      // Delay before closing and passing data back
      setTimeout(() => {
        onVerified(response.data);
        onOpenChange(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed');

      // Parse attempts remaining from error
      if (err.message?.includes('attempt')) {
        const match = err.message.match(/(\d+) attempt/);
        if (match) {
          setAttemptsRemaining(parseInt(match[1]));
        }
      }

      // Check if max attempts or expired
      if (err.message?.includes('invalidated') || err.message?.includes('expired')) {
        setStage('error');
      } else {
        setStage('input');
        setOtp('');
      }
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setOtp('');
    setError('');
    setAttemptsRemaining(null);
    setDevOtp('');
    setStage('sending');

    try {
      const response = await otpAPI.resend(childId, vaccineId);
      setPhoneDisplay(response.phoneLastFour || '******');
      setExpiresIn(response.expiresIn || 300);
      setResendCooldown(60);
      if (response.devOtp) {
        setDevOtp(response.devOtp);
      }
      setStage('input');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
      setStage('error');
    }
  };

  const handleOtpComplete = useCallback((value: string) => {
    setOtp(value);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (stage !== 'verifying') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Vaccine Authorization
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ─── SENDING STATE ─── */}
          {stage === 'sending' && (
            <motion.div
              key="sending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center py-8 gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Sending OTP</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sending verification code to parent's phone...
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── INPUT STATE ─── */}
          {stage === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-4"
            >
              {/* Info */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Phone className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Administering <span className="font-semibold text-foreground">{vaccineName}</span> for{' '}
                  <span className="font-semibold text-foreground">{childName}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  OTP sent to <span className="font-mono font-semibold text-foreground">{phoneDisplay}</span>
                </p>
              </div>

              {/* OTP display when no real SMS provider is configured */}
              {devOtp && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                  <p className="text-xs text-amber-400 mb-1">No SMS provider configured — use this OTP:</p>
                  <p className="font-mono text-2xl font-bold tracking-widest text-amber-300">{devOtp}</p>
                </div>
              )}

              {/* OTP Input */}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpComplete}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-lg font-semibold" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-lg font-semibold" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-lg font-semibold" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="w-12 h-14 text-lg font-semibold" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-lg font-semibold" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-lg font-semibold" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
                >
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              {/* Attempts remaining */}
              {attemptsRemaining !== null && attemptsRemaining < 4 && (
                <p className="text-xs text-center text-warning">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                </p>
              )}

              {/* Timer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Expires in:{' '}
                  <span className={expiresIn < 60 ? 'text-destructive font-medium' : 'font-medium'}>
                    {formatTime(expiresIn)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={otp.length !== 6}
                className="w-full gap-2"
                size="lg"
              >
                <ShieldCheck className="w-4 h-4" />
                Verify & Administer
              </Button>
            </motion.div>
          )}

          {/* ─── VERIFYING STATE ─── */}
          {stage === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center py-8 gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Verifying OTP</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please wait while we verify and update the vaccine record...
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── SUCCESS STATE ─── */}
          {stage === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-8 gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-success" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-lg">Vaccine Administered!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {vaccineName} has been marked as completed for {childName}.
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── ERROR STATE ─── */}
          {stage === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-4"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Verification Failed</p>
                  <p className="text-sm text-muted-foreground mt-2">{error}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={sendOtp} className="flex-1 gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Request New OTP
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default OtpVerificationDialog;
