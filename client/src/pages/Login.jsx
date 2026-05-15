import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const { signIn, loadProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!email.trim()) {
      e.email = t('auth.errorEmail');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = t('auth.errorEmailInvalid');
    }
    if (!password) {
      e.password = t('auth.errorPassword');
    } else if (password.length < 6) {
      e.password = t('toast.passwordLength');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      const msg = error.message || '';
      if (msg.includes('not configured') || msg.includes('Database')) {
        toast.error('⚠️ Supabase not configured. Add credentials to client/.env and restart.');
      } else if (msg.includes('Invalid login') || msg.includes('invalid_credentials') || msg.includes('Invalid email or password')) {
        toast.error(t('auth.invalidCredentials'));
      } else {
        toast.error(msg || t('auth.loginFailed'));
      }
    } else {
      toast.success(t('auth.welcomeBack'));
      navigate('/');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setAdminLoading(true);
    const { error, data } = await signIn(email, password);
    setAdminLoading(false);
    if (error) {
      const msg = error.message || '';
      if (msg.includes('not configured') || msg.includes('Database')) {
        toast.error('⚠️ Supabase not configured. Add credentials to client/.env and restart.');
      } else if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        toast.error(t('auth.invalidCredentials'));
      } else {
        toast.error(msg || t('auth.loginFailed'));
      }
      return;
    }

    const profileData = data?.user ? await loadProfile(data.user) : null;
    const isAdminUser = profileData?.role === 'admin' || data?.user?.app_metadata?.role === 'admin';

    if (!isAdminUser) {
      toast.error('Admin access required. Please use an admin account.');
      return;
    }

    toast.success(t('auth.welcomeBackAdmin'));
    navigate('/admin/dashboard');
  };

  const FieldError = ({ field }) =>
    errors[field] ? <p className="text-rose-400 text-xs mt-1">{errors[field]}</p> : null;

  return (
    <div className="page-wrapper flex items-center justify-center min-h-[80vh] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <span className="text-4xl mb-4 block">💧</span>
            <h1 className="text-2xl font-bold text-white">{t('auth.welcomeBack')}</h1>
            <p className="text-slate-400 text-sm mt-2">{t('auth.signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="input-label">{t('auth.email')}</label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'border-rose-500/60' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
              />
              <FieldError field="email" />
            </div>

            <div>
              <label className="input-label">{t('auth.password')}</label>
              <input
                type="password"
                className={`input-field ${errors.password ? 'border-rose-500/60' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
              />
              <FieldError field="password" />
            </div>

            {/* User Login Button */}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-500 text-xs">{t('auth.or')}</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Admin Login Button */}
            <button
              type="button"
              disabled={adminLoading}
              onClick={handleAdminLogin}
              className="w-full py-3 px-4 rounded-xl border-2 border-[#3E5F78] text-[#9FB7C8] font-semibold text-sm hover:bg-[#3E5F78]/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              🛡️ {adminLoading ? t('auth.signingIn') : t('auth.loginAsAdmin')}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              {t('nav.register')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}