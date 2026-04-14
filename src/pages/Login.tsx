import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Stethoscope, ArrowRight, Eye, EyeOff, UserPlus, Building2, Phone, Mail, Lock, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { authAPI } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

type PortalType = 'parent' | 'doctor' | null;
type FormMode = 'login' | 'register';

const Login: React.FC = () => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(null);
  const [formMode, setFormMode] = useState<FormMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regHospital, setRegHospital] = useState('');
  const [regSpecialization, setRegSpecialization] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registeredDoctorId, setRegisteredDoctorId] = useState('');
  
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Welcome back!', {
        description: 'You have successfully logged in.',
      });
      navigate(selectedPortal === 'doctor' ? '/doctor' : '/parent');
    } else {
      toast.error('Login failed', {
        description: result.error || 'Invalid credentials',
      });
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: 'doctor',
        phone: regPhone || undefined,
        hospitalName: regHospital || undefined,
        specialization: regSpecialization || undefined,
      });

      if (response.success) {
        const doctorId = response.data?.user?.doctorId;
        if (doctorId) {
          setRegisteredDoctorId(doctorId);
        }

        toast.success('Registration successful!', {
          description: `Your Doctor ID is: ${doctorId || 'Generated'}`,
          duration: 8000,
        });

        // Auto-login after registration
        const loginResult = await login(regEmail, regPassword);
        if (loginResult.success) {
          setTimeout(() => navigate('/doctor'), 1500);
        }
      }
    } catch (error: any) {
      toast.error('Registration failed', {
        description: error.message || 'An error occurred',
      });
    }

    setIsLoading(false);
  };

  const demoCredentials = {
    parent: { email: 'parent@demo.com', password: 'password123' },
    doctor: { email: 'doctor@aiims.com', password: 'password123' },
  };

  const fillDemoCredentials = () => {
    if (selectedPortal) {
      setEmail(demoCredentials[selectedPortal].email);
      setPassword(demoCredentials[selectedPortal].password);
    }
  };

  const resetForm = () => {
    setSelectedPortal(null);
    setFormMode('login');
    setEmail('');
    setPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhone('');
    setRegHospital('');
    setRegSpecialization('');
    setRegisteredDoctorId('');
  };

  const specializations = [
    'Pediatrics',
    'General Physician',
    'Family Medicine',
    'Neonatology',
    'Immunology',
    'Internal Medicine',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-medical-50 dark:via-muted to-background flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-medical"
          >
            <Shield className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="font-display font-bold text-3xl gradient-text mb-2">
            {t('appName')}
          </h1>
          <p className="text-muted-foreground">{t('tagline')}</p>
        </div>

        {/* Portal Selection */}
        <AnimatePresence mode="wait">
          {!selectedPortal ? (
            <motion.div
              key="portal-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-center font-medium text-foreground mb-6">
                Choose your portal
              </h2>

              <button
                onClick={() => setSelectedPortal('parent')}
                className="w-full card-medical p-6 text-left group hover:border-primary/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{t('parentPortal')}</h3>
                    <p className="text-sm text-muted-foreground">Track your child's vaccinations</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>

              <button
                onClick={() => setSelectedPortal('doctor')}
                className="w-full card-medical p-6 text-left group hover:border-secondary/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <Stethoscope className="w-7 h-7 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{t('doctorPortal')}</h3>
                    <p className="text-sm text-muted-foreground">Update patient records</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`${selectedPortal}-${formMode}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-medical p-6"
            >
              {/* Back Button */}
              <button
                onClick={resetForm}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
              >
                ← Back to portal selection
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedPortal === 'doctor' ? 'bg-secondary/10' : 'bg-primary/10'
                }`}>
                  {formMode === 'register' ? (
                    <UserPlus className="w-6 h-6 text-secondary" />
                  ) : selectedPortal === 'doctor' ? (
                    <Stethoscope className="w-6 h-6 text-secondary" />
                  ) : (
                    <Users className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {formMode === 'register'
                      ? 'Register as Doctor'
                      : selectedPortal === 'doctor'
                        ? t('doctorPortal')
                        : t('parentPortal')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formMode === 'register'
                      ? 'Create your healthcare provider account'
                      : t('enterCredentials')}
                  </p>
                </div>
              </div>

              {/* ─── LOGIN FORM ─── */}
              {formMode === 'login' && (
                <>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('email')}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          placeholder="Enter your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full btn-medical flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>
                          {t('login')}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Demo Credentials */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
                    <div className="text-sm font-mono text-foreground">
                      <p>Email: {demoCredentials[selectedPortal].email}</p>
                      <p>Password: {demoCredentials[selectedPortal].password}</p>
                    </div>
                    <button
                      type="button"
                      onClick={fillDemoCredentials}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      Click to fill demo credentials
                    </button>
                  </div>

                  {/* Register CTA - only for doctors */}
                  {selectedPortal === 'doctor' && (
                    <div className="mt-4 pt-4 border-t border-border text-center">
                      <p className="text-sm text-muted-foreground mb-2">New healthcare provider?</p>
                      <button
                        onClick={() => setFormMode('register')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Register as Doctor
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ─── REGISTRATION FORM ─── */}
              {formMode === 'register' && (
                <>
                  {/* Success state with Doctor ID */}
                  {registeredDoctorId ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 space-y-4"
                    >
                      <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                        <BadgeCheck className="w-8 h-8 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Your unique Doctor ID:</p>
                        <p className="font-mono text-3xl font-bold tracking-wider text-primary">
                          {registeredDoctorId}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Share this ID with patients so they can assign you as their doctor.
                        <br />Redirecting to dashboard...
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-3">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                          placeholder="Dr. Jane Smith"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            placeholder="doctor@hospital.com"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Password *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            placeholder="Min. 6 characters"
                            minLength={6}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Phone + Hospital row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="tel"
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                              placeholder="9876543210"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Hospital</label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              value={regHospital}
                              onChange={(e) => setRegHospital(e.target.value)}
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                              placeholder="AIIMS Delhi"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Specialization */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Specialization</label>
                        <select
                          value={regSpecialization}
                          onChange={(e) => setRegSpecialization(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        >
                          <option value="">Select specialization</option>
                          {specializations.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-medical flex items-center justify-center gap-2 mt-2"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            Create Doctor Account
                          </>
                        )}
                      </button>

                      {/* Back to login */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setFormMode('login')}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Already have an account? <span className="text-primary">Login</span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
