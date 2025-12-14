import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Stethoscope, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

type PortalType = 'parent' | 'doctor' | null;

const Login: React.FC = () => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-medical-50 to-background flex items-center justify-center p-4">
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
        {!selectedPortal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card-medical p-6"
          >
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedPortal(null);
                setEmail('');
                setPassword('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Back to portal selection
            </button>

            {/* Login Form */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedPortal === 'doctor' ? 'bg-secondary/10' : 'bg-primary/10'
              }`}>
                {selectedPortal === 'doctor' ? (
                  <Stethoscope className="w-6 h-6 text-secondary" />
                ) : (
                  <Users className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedPortal === 'doctor' ? t('doctorPortal') : t('parentPortal')}
                </h3>
                <p className="text-sm text-muted-foreground">{t('enterCredentials')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
