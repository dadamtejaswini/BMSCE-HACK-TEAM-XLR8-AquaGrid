import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिं' },
  { code: 'kn', label: 'ಕನ್ನ' },
];

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/map', label: 'Map' },
  { path: '/forecast', label: 'Forecast' },
  { path: '/compare', label: 'Compare' },
];

const protectedLinks = [
  { path: '/book-water', label: 'Book Water' },
  { path: '/my-orders', label: 'My Orders' },
];

const adminLinks = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/orders', label: 'Orders' },
  { path: '/admin/map', label: 'Admin Map' },
  { path: '/admin/users', label: 'Users' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const { user, profile, isAuthenticated, isAdmin, signOut, demoLogin } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const isActive = (path) => location.pathname === path;

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('aquagrid_lang', code);
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(19, 42, 58, 0.9)', borderColor: 'rgba(62, 95, 120, 0.3)' }}>
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">💧</span>
            <span className="text-xl font-bold text-gradient">AquaGrid</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(link.path)
                    ? 'text-cyan-400 bg-blue-500/10'
                    : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/60'
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && protectedLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(link.path)
                    ? 'text-cyan-400 bg-blue-500/10'
                    : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/60'
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Admin dropdown */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${location.pathname.startsWith('/admin')
                      ? 'text-cyan-400 bg-blue-500/10'
                      : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/60'
                    }`}
                >
                  Admin ▾
                </button>
                <AnimatePresence>
                  {adminMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 glass-card py-2 shadow-xl"
                    >
                      {adminLinks.map(link => (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setAdminMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-300 hover:text-blue-300 hover:bg-slate-700/60 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Language switcher + Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-all ${
                    i18n.language === lang.code
                      ? 'bg-blue-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-blue-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-400">
                  <span className="text-blue-300 font-medium">{profile?.name || user?.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-rose-400 border border-slate-700 rounded-lg hover:border-rose-500/40 transition-all"
                >
                  {t('nav.signOut')}
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={demoLogin}
                  className="px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 border border-cyan-600/30 rounded-lg hover:border-cyan-500/50 transition-all"
                >
                  {t('nav.demoLogin')}
                </button>
                <Link to="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-blue-300 transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary text-sm !px-5 !py-2">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-slate-300 hover:text-blue-400 transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-blue-800/30"
            >
              <div className="py-4 space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all
                      ${isActive(link.path) ? 'text-cyan-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-300'}`}
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated && protectedLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all
                      ${isActive(link.path) ? 'text-cyan-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-300'}`}
                  >
                    {link.label}
                  </Link>
                ))}

                {isAdmin && (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
                    {adminLinks.map(link => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-3 rounded-lg text-sm text-slate-400 hover:text-blue-300"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </>
                )}

                <div className="pt-4 border-t border-blue-800/30 space-y-2 px-4">
                  {isAuthenticated ? (
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="w-full btn-secondary text-sm">
                      Sign Out
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { demoLogin(); setMobileOpen(false); }} className="w-full btn-secondary text-sm !border-cyan-600/40 !text-cyan-400">
                        Demo Login
                      </button>
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="block w-full text-center btn-secondary text-sm">Login</Link>
                      <Link to="/register" onClick={() => setMobileOpen(false)} className="block w-full text-center btn-primary text-sm">Register</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
