import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Globe, User, Menu, X, MapPin, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationDropdown from '@/components/NotificationDropdown';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Unified Brand Logo & NIS 2025 Badge */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-emerald-400/30 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl sm:text-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent tracking-tight">
                VacciTrack
              </span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                NIS 2025
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Find Centers Link */}
            <Link
              to="/centers"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all shadow-2xs active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Find Centers</span>
            </Link>

            {/* Theme Toggle */}
            <div className="p-0.5 rounded-full bg-card/80 border border-border/80 shadow-2xs">
              <ThemeToggle />
            </div>

            {/* Language Segmented Control */}
            <div className="flex items-center p-0.5 rounded-full bg-card/80 border border-border/80 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  'px-3 py-1 rounded-full transition-all text-xs',
                  language === 'en'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Switch to English"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={cn(
                  'px-3 py-1 rounded-full transition-all text-xs',
                  language === 'hi'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="हिंदी में बदलें"
              >
                हिंदी
              </button>
            </div>

            {user && <NotificationDropdown />}

            {user && (
              <>
                {/* User Info Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/80 border border-border/80 shadow-2xs text-xs font-medium text-foreground">
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-semibold">{user.name}</span>
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
                    user.role === 'doctor' 
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25' 
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  )}>
                    {user.role === 'doctor' ? 'Doctor' : 'Parent'}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border border-border/80 hover:border-rose-500/30 transition-all active:scale-95 shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-2xl bg-card/80 border border-border/80 text-foreground shadow-2xs hover:bg-muted"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-2xl"
          >
            <div className="px-4 py-4 space-y-2.5">
              <Link
                to="/centers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full px-3.5 py-2 rounded-2xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25"
              >
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Find Vaccination Centers</span>
              </Link>

              <div className="flex items-center gap-2">
                <ThemeToggle variant="with-label" className="flex-1 justify-start rounded-2xl bg-card/80 border border-border/80" />
              </div>
              
              {/* Mobile Language Segmented Control */}
              <div className="flex items-center p-1 rounded-2xl bg-card/80 border border-border/80 text-xs font-semibold w-full">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={cn(
                    'flex-1 py-1.5 rounded-xl transition-all text-xs text-center',
                    language === 'en'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={cn(
                    'flex-1 py-1.5 rounded-xl transition-all text-xs text-center',
                    language === 'hi'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  हिंदी
                </button>
              </div>

              {user && (
                <>
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-card/80 border border-border/80 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-foreground">{user.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3.5 py-2 rounded-2xl text-xs font-semibold text-rose-600 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
