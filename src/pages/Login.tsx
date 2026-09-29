import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Stethoscope, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Building2, 
  Phone, 
  Mail, 
  Lock, 
  BadgeCheck,
  Globe,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Sparkles
} from 'lucide-react';
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
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success(language === 'hi' ? 'वापस स्वागत है!' : 'Welcome back!', {
        description: language === 'hi' ? 'आप सफलतापूर्वक लॉगिन हो चुके हैं।' : 'You have successfully logged in.',
      });
      navigate(selectedPortal === 'doctor' ? '/doctor' : '/parent');
    } else {
      toast.error(language === 'hi' ? 'लॉगिन विफल' : 'Login failed', {
        description: result.error || (language === 'hi' ? 'अमान्य ईमेल या पासवर्ड' : 'Invalid credentials'),
      });
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const isDoctor = selectedPortal === 'doctor';

    try {
      const response = await authAPI.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: isDoctor ? 'doctor' : 'parent',
        phone: regPhone || undefined,
        hospitalName: isDoctor ? (regHospital || undefined) : undefined,
        specialization: isDoctor ? (regSpecialization || undefined) : undefined,
      });

      if (response.success) {
        if (isDoctor) {
          const doctorId = response.data?.user?.doctorId;
          if (doctorId) {
            setRegisteredDoctorId(doctorId);
          }

          toast.success(language === 'hi' ? 'डॉक्टर पंजीकरण सफल!' : 'Doctor registration successful!', {
            description: `Your Doctor ID is: ${doctorId || 'Generated'}`,
            duration: 8000,
          });

          // Auto-login after registration
          const loginResult = await login(regEmail, regPassword);
          if (loginResult.success) {
            setTimeout(() => navigate('/doctor'), 1500);
          }
        } else {
          toast.success(language === 'hi' ? 'पैरेंट पंजीकरण सफल!' : 'Parent registration successful!', {
            description: language === 'hi' 
              ? `स्वागत है ${regName}! आपका पैरेंट खाता सक्रिय हो गया है।` 
              : `Welcome ${regName}! Your family immunization account is ready.`,
            duration: 4000,
          });

          // Auto-login after registration
          const loginResult = await login(regEmail, regPassword);
          if (loginResult.success) {
            setTimeout(() => navigate('/parent'), 1200);
          }
        }
      }
    } catch (error: any) {
      toast.error(language === 'hi' ? 'पंजीकरण विफल' : 'Registration failed', {
        description: error.message || 'An error occurred during registration',
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
    { en: 'Pediatrics', hi: 'बाल रोग (Pediatrics)' },
    { en: 'General Physician', hi: 'सामान्य चिकित्सक (General Physician)' },
    { en: 'Family Medicine', hi: 'पारिवारिक चिकित्सा (Family Medicine)' },
    { en: 'Neonatology', hi: 'नवजात शिशु रोग (Neonatology)' },
    { en: 'Immunology', hi: 'इम्यूनोलॉजी (Immunology)' },
    { en: 'Internal Medicine', hi: 'आंतरिक चिकित्सा (Internal Medicine)' },
    { en: 'Other', hi: 'अन्य (Other)' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col justify-between selection:bg-teal-500/20">
      {/* Ambient Glowing Gradients & Dot Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle dot grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.10] dark:opacity-[0.16]" />
        
        {/* Soft Radial Ambient Glow Orbs */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-48 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={resetForm}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl tracking-tight text-foreground">
                Vacci<span className="text-teal-600 dark:text-teal-400">Track</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 uppercase tracking-wider">
                NIS 2025
              </span>
            </div>
          </div>

          {/* Right Controls: Find Centers + Language + Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/centers')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-all shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>{language === 'hi' ? 'टीकाकरण केंद्र खोजें' : 'Find Centers'}</span>
            </button>

            {/* Clear Language Switcher Pill */}
            <div className="flex items-center p-0.5 rounded-xl bg-muted/60 border border-border/80 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-card text-teal-600 dark:text-teal-400 font-bold shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Switch to English"
              >
                <span>English</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  language === 'hi'
                    ? 'bg-card text-teal-600 dark:text-teal-400 font-bold shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="हिंदी में बदलें"
              >
                <span>हिंदी</span>
              </button>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-4 sm:py-6 relative z-10 w-full my-auto">
        <AnimatePresence mode="wait">
          {!selectedPortal ? (
            <motion.div
              key="portal-selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="w-full flex-1 flex flex-col justify-center items-center px-4"
            >
              {/* Hero Header */}
              <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
                {/* Glowing NIS 2025 Pill Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shadow-xs mb-3.5 backdrop-blur-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {language === 'hi' 
                      ? 'राष्ट्रीय टीकाकरण कार्यक्रम (NIS 2025) प्रमाणित • आभा (ABHA) लिंक'
                      : 'National Immunization Schedule (NIS) 2025 Compliant • ABHA Linked'}
                  </span>
                </motion.div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-foreground mb-2 sm:mb-3">
                  Vacci<span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">Track</span>
                </h1>

                <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {language === 'hi'
                    ? 'अपने बच्चे के सुरक्षित भविष्य की ढाल — भारत का डिजिटल टीकाकरण प्रबंधन मंच'
                    : "Shield Your Child's Future — India's Digital Immunization Management Platform"}
                </p>
              </div>

              {/* Side-by-Side Interactive Portal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto w-full mb-2">
                {/* Card 1: Parent & Guardian Portal */}
                <motion.div
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedPortal('parent')}
                  className="group relative p-5 sm:p-7 rounded-3xl bg-card/85 hover:bg-card border border-border/80 hover:border-emerald-500/60 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transition-all cursor-pointer flex flex-col justify-between overflow-hidden backdrop-blur-xl"
                >
                  {/* Top glowing gradient highlight */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all shadow-xs">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {language === 'hi' ? 'परिवारों के लिए' : 'For Families'}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {language === 'hi' ? 'माता-पिता व अभिभावक पोर्टल' : 'Parent & Guardian Portal'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
                      {language === 'hi'
                        ? 'अपने बच्चे की टीकाकरण यात्रा को ट्रैक करें और रीयल-टाइम डिजिटल सुरक्षा पाएं।'
                        : "Track and safeguard your child's immunization journey with real-time digital protection."}
                    </p>

                    {/* Feature Highlights */}
                    <ul className="space-y-2.5 mb-5 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{language === 'hi' ? 'संपूर्ण NIS 2025 शेड्यूल (जन्म से 16 वर्ष)' : 'Complete NIS 2025 Schedule (Birth to 16 Yrs)'}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{language === 'hi' ? 'त्वरित क्यूआर (QR) डिजिटल प्रमाण पत्र' : 'Instant QR Vaccine Certificate'}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{language === 'hi' ? '24/7 एआई बाल रोग मार्गदर्शन (VaxBot)' : '24/7 AI Pediatric Guidance'}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                      {language === 'hi' ? 'पैरेंट पोर्टल में प्रवेश करें →' : 'Enter Parent Portal →'}
                    </span>
                  </div>
                </motion.div>

                {/* Card 2: Doctor & Healthcare Provider Portal */}
                <motion.div
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedPortal('doctor')}
                  className="group relative p-5 sm:p-7 rounded-3xl bg-card/85 hover:bg-card border border-border/80 hover:border-cyan-500/60 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transition-all cursor-pointer flex flex-col justify-between overflow-hidden backdrop-blur-xl"
                >
                  {/* Top glowing gradient highlight */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/25 transition-all shadow-xs">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {language === 'hi' ? 'स्वास्थ्य कर्मियों के लिए' : 'For Clinicians'}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {language === 'hi' ? 'डॉक्टर व क्लिनिक पोर्टल' : 'Doctor & Clinic Portal'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
                      {language === 'hi'
                        ? 'अधिकृत बाल रोग विशेषज्ञ एवं सरकारी पीएचसी स्टाफ सत्यापन व टीकाकरण रिकॉर्ड।'
                        : 'Authorized pediatricians & government PHC staff verification and administration logs.'}
                    </p>

                    {/* Feature Highlights */}
                    <ul className="space-y-2.5 mb-5 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                        <span>{language === 'hi' ? 'ओटीपी (OTP) सत्यापित सुरक्षित टीकाकरण' : 'OTP-Verified Administration'}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                        <span>{language === 'hi' ? '14-अंकीय आभा (ABHA) आईडी सत्यापन' : '14-Digit ABHA ID Lookup'}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                        <span>{language === 'hi' ? 'रीयल-टाइम क्लिनिक एवं मरीज रिकॉर्ड' : 'Real-Time Cohort & Clinic Logs'}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                      {language === 'hi' ? 'डॉक्टर पोर्टल में प्रवेश करें →' : 'Enter Doctor Portal →'}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`${selectedPortal}-${formMode}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md mx-auto px-4"
            >
              <div className="card-medical p-6 sm:p-7 shadow-2xl border border-border/80 backdrop-blur-xl bg-card/95 rounded-3xl">
                {/* Back Button */}
                <button
                  onClick={resetForm}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1.5 transition-colors group"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  {language === 'hi' ? 'पोर्टल चयन पर वापस जाएं' : 'Back to portal selection'}
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                    selectedPortal === 'doctor' 
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' 
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {formMode === 'register' ? (
                      selectedPortal === 'doctor' ? <UserPlus className="w-6 h-6" /> : <Users className="w-6 h-6" />
                    ) : selectedPortal === 'doctor' ? (
                      <Stethoscope className="w-6 h-6" />
                    ) : (
                      <Users className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      {formMode === 'register'
                        ? selectedPortal === 'doctor'
                          ? (language === 'hi' ? 'डॉक्टर पंजीकरण' : 'Register as Doctor')
                          : (language === 'hi' ? 'माता-पिता पंजीकरण' : 'Register as Parent')
                        : selectedPortal === 'doctor'
                          ? (language === 'hi' ? 'डॉक्टर व क्लिनिक पोर्टल' : 'Doctor & Clinic Portal')
                          : (language === 'hi' ? 'माता-पिता व अभिभावक पोर्टल' : 'Parent & Guardian Portal')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formMode === 'register'
                        ? selectedPortal === 'doctor'
                          ? (language === 'hi' ? 'स्वास्थ्य सेवा प्रदाता खाता बनाएं' : 'Create your healthcare provider account')
                          : (language === 'hi' ? 'अपने परिवार का डिजिटल टीकाकरण खाता बनाएं' : 'Create your family immunization account')
                        : (language === 'hi' ? 'आगे बढ़ने के लिए अपना विवरण दर्ज करें' : 'Enter your credentials to continue')}
                    </p>
                  </div>
                </div>

                {/* ─── LOGIN FORM ─── */}
                {formMode === 'login' && (
                  <>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          placeholder={language === 'hi' ? 'अपना ईमेल दर्ज करें' : 'Enter your email'}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {language === 'hi' ? 'पासवर्ड' : 'Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder={language === 'hi' ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
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
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                          selectedPortal === 'doctor'
                            ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-700 hover:to-teal-700 shadow-cyan-500/25 border border-cyan-400/30'
                            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25 border border-emerald-400/30'
                        }`}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          <>
                            {language === 'hi' ? 'लॉगिन करें' : 'Login'}
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2">
                        {language === 'hi' ? 'डेमो लॉगिन विवरण:' : 'Demo Credentials:'}
                      </p>
                      <div className="text-sm font-mono text-foreground">
                        <p>{language === 'hi' ? 'ईमेल:' : 'Email:'} {demoCredentials[selectedPortal].email}</p>
                        <p>{language === 'hi' ? 'पासवर्ड:' : 'Password:'} {demoCredentials[selectedPortal].password}</p>
                      </div>
                      <button
                        type="button"
                        onClick={fillDemoCredentials}
                        className="mt-2 text-xs text-primary hover:underline font-medium"
                      >
                        {language === 'hi' ? 'डेमो विवरण स्वतः भरें (क्लिक करें)' : 'Click to fill demo credentials'}
                      </button>
                    </div>

                    {/* Register CTA for Doctors */}
                    {selectedPortal === 'doctor' && (
                      <div className="mt-4 pt-4 border-t border-border text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          {language === 'hi' ? 'नए डॉक्टर या स्वास्थ्य कर्मी हैं?' : 'New healthcare provider?'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setFormMode('register')}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          {language === 'hi' ? 'डॉक्टर के रूप में रजिस्टर करें' : 'Register as Doctor'}
                        </button>
                      </div>
                    )}

                    {/* Register CTA for Parents */}
                    {selectedPortal === 'parent' && (
                      <div className="mt-4 pt-4 border-t border-border text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          {language === 'hi' ? 'नए माता-पिता या अभिभावक हैं?' : 'New parent or guardian?'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setFormMode('register')}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          {language === 'hi' ? 'माता-पिता के रूप में रजिस्टर करें' : 'Register as Parent'}
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
                          <p className="text-sm text-muted-foreground mb-1">
                            {language === 'hi' ? 'आपकी विशिष्ट डॉक्टर आईडी:' : 'Your unique Doctor ID:'}
                          </p>
                          <p className="font-mono text-3xl font-bold tracking-wider text-primary">
                            {registeredDoctorId}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === 'hi' 
                            ? 'यह आईडी मरीजों के साथ साझा करें ताकि वे आपको अपने डॉक्टर के रूप में जोड़ सकें।' 
                            : 'Share this ID with patients so they can assign you as their doctor.'}
                          <br />
                          {language === 'hi' ? 'डैशबोर्ड पर पुनर्निर्देशित किया जा रहा है...' : 'Redirecting to dashboard...'}
                        </p>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleRegister} className="space-y-3">
                        {/* Name */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {selectedPortal === 'doctor'
                              ? (language === 'hi' ? 'डॉक्टर का पूरा नाम *' : 'Doctor Full Name *')
                              : (language === 'hi' ? 'माता-पिता / अभिभावक का नाम *' : 'Parent / Guardian Full Name *')}
                          </label>
                          <input
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            placeholder={selectedPortal === 'doctor' ? (language === 'hi' ? 'डॉ. राहुल शर्मा' : 'Dr. Jane Smith') : (language === 'hi' ? 'अनन्या शर्मा' : 'Ananya Sharma')}
                            required
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {language === 'hi' ? 'ईमेल पता *' : 'Email *'}
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                              placeholder={selectedPortal === 'doctor' ? 'doctor@hospital.com' : 'parent@gmail.com'}
                              required
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {language === 'hi' ? 'पासवर्ड *' : 'Password *'}
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                              placeholder={language === 'hi' ? 'न्यूनतम 6 अक्षर' : 'Min. 6 characters'}
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

                        {/* Phone Number */}
                        {selectedPortal === 'doctor' ? (
                          /* Doctor: Phone + Hospital row */
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                {language === 'hi' ? 'फ़ोन नंबर' : 'Phone'}
                              </label>
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
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                {language === 'hi' ? 'अस्पताल / PHC' : 'Hospital'}
                              </label>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                  type="text"
                                  value={regHospital}
                                  onChange={(e) => setRegHospital(e.target.value)}
                                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                  placeholder={language === 'hi' ? 'एम्स दिल्ली / PHC' : 'AIIMS Delhi'}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Parent: Phone Number (for WhatsApp/SMS & OTP reminders) */
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              {language === 'hi' 
                                ? 'मोबाइल नंबर (SMS और OTP रिमाइंडर के लिए)' 
                                : 'Mobile Number (for SMS & OTP Reminders)'}
                            </label>
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
                        )}

                        {/* Specialization (Doctor only) */}
                        {selectedPortal === 'doctor' && (
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              {language === 'hi' ? 'विशेषज्ञता (स्पेशलाइजेशन)' : 'Specialization'}
                            </label>
                            <select
                              value={regSpecialization}
                              onChange={(e) => setRegSpecialization(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            >
                              <option value="">{language === 'hi' ? 'विशेषज्ञता चुनें' : 'Select specialization'}</option>
                              {specializations.map((s) => (
                                <option key={s.en} value={s.en}>
                                  {language === 'hi' ? s.hi : s.en}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 mt-4 transition-all ${
                            selectedPortal === 'doctor'
                              ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-700 hover:to-teal-700 shadow-cyan-500/25 border border-cyan-400/30'
                              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25 border border-emerald-400/30'
                          }`}
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-5 h-5" />
                              {selectedPortal === 'doctor'
                                ? (language === 'hi' ? 'डॉक्टर खाता बनाएं' : 'Create Doctor Account')
                                : (language === 'hi' ? 'पैरेंट खाता बनाएं' : 'Create Parent Account')}
                            </>
                          )}
                        </button>

                        {/* Trust highlight for parents */}
                        {selectedPortal === 'parent' && (
                          <p className="text-[11px] text-center text-muted-foreground/80 pt-1">
                            {language === 'hi' 
                              ? '✨ निःशुल्क पंजीकरण • त्वरित क्यूआर प्रमाण पत्र • 25+ NIS टीके' 
                              : '✨ Free registration • Instant QR Vaccine Certificate • 25+ Vaccines NIS 2025'}
                          </p>
                        )}

                        {/* Back to login */}
                        <div className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => setFormMode('login')}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {language === 'hi' ? 'पहले से खाता है? ' : 'Already have an account? '}
                            <span className="text-primary font-semibold">
                              {language === 'hi' ? 'लॉगिन करें' : 'Login'}
                            </span>
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Trust & Compliance Strip */}
      <footer className="relative z-20 pb-4 pt-3 px-4 border-t border-border/40 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 backdrop-blur-xs shadow-2xs hover:border-emerald-500/30 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === 'hi' ? '25+ NIS राष्ट्रीय टीके' : '25+ NIS Vaccines'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 backdrop-blur-xs shadow-2xs hover:border-teal-500/30 transition-colors">
            <Lock className="w-3.5 h-3.5 text-teal-500" />
            <span>{language === 'hi' ? 'OTP सत्यापित सुरक्षा' : 'OTP Verified'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 backdrop-blur-xs shadow-2xs hover:border-cyan-500/30 transition-colors">
            <BadgeCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>{language === 'hi' ? 'आभा (ABHA) एकीकृत' : 'ABHA Integrated'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 backdrop-blur-xs shadow-2xs hover:border-blue-500/30 transition-colors">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>{language === 'hi' ? 'हिंदी एवं English' : 'English & हिन्दी'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
