import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WARDS_DATA, findNearestWard } from '../data/wards';

// Aadhaar step removed — now 3 steps only
const STEP_KEYS = ['auth.step1', 'auth.step2', 'auth.step3'];

export default function Register() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { signUp, saveProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    ward_name: '',
    ward_number: '',
    address: '',
    alert_email_scarcity: true,
    alert_email_critical: true,
    alert_booking_reminders: true,
    notification_frequency: 'immediate',
  });

  const [errors, setErrors] = useState({});
  const [wardSearch, setWardSearch] = useState('');
  const [showWardList, setShowWardList] = useState(false);

  const filteredWards = WARDS_DATA.filter(w =>
    w.ward_name.toLowerCase().includes(wardSearch.toLowerCase())
  );

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    // Clear error on change
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const selectWard = (w) => {
    set('ward_name', w.ward_name);
    set('ward_number', w.ward_number);
    setWardSearch(w.ward_name);
    setShowWardList(false);
  };

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const nearest = findNearestWard(pos.coords.latitude, pos.coords.longitude);
          if (nearest) {
            selectWard(nearest);
            toast.success(`${t('auth.detected')}: ${nearest.ward_name}`);
          }
        },
        () => toast.error(t('auth.locationError'))
      );
    } else {
      toast.error(t('auth.locationNotSupported'));
    }
  };
const validateStep0 = () => {
  const e = {};
  if (!form.name.trim()) e.name = t('auth.errorName');
  if (!form.email.trim()) {
    e.email = t('auth.errorEmail');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    e.email = t('auth.errorEmailInvalid');
  }
  if (!form.phone.trim()) {
    e.phone = t('auth.errorPhone');
  } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
    e.phone = t('auth.errorPhoneStart');
  }
  if (!form.password) {
    e.password = t('auth.errorPassword');
  } else if (form.password.length < 6) {
    e.password = t('toast.passwordLength');
  }
  if (!form.confirmPassword) {
    e.confirmPassword = t('auth.errorConfirmPassword');
  } else if (form.password !== form.confirmPassword) {
    e.confirmPassword = t('toast.passwordMismatch');
  }
  setErrors(e);
  return Object.keys(e).length === 0;
};

  const validateStep1 = () => {
    const e = {};
    if (!form.ward_name) e.ward_name = t('auth.errorWard');
    if (!form.address.trim()) e.address = t('auth.errorAddress');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep(s => Math.min(s + 1, 2));
  };

  const prevStep = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 0));
  };

  // ── SUBMIT ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create auth user
      const { data, error } = await signUp(form.email, form.password);
      if (error) throw error;
      if (!data || !data.user) throw new Error(t('auth.registrationFailed'));

      // 2. Save profile using the returned user id explicitly
      const profileData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        ward_name: form.ward_name,
        ward_number: Number(form.ward_number) || null,
        address: form.address.trim(),
        alert_on_scarcity: form.alert_email_scarcity,
        alert_on_critical: form.alert_email_critical,
        booking_reminders: form.alert_booking_reminders,
        notification_frequency: form.notification_frequency,
        preferred_language: localStorage.getItem('aquagrid_lang') || 'en',
      };

      try {
        const { error: profileError } = await saveProfile(profileData, data.user.id);
        if (profileError) {
          if (profileError.message.includes('Could not find the table')) {
            console.warn('Supabase table "users" missing. Using localStorage fallback.');
          } else {
            console.error('Profile save error:', profileError);
            toast.warning(t('auth.profileSaveWarning'));
          }
        }
      } catch (e) {
        console.error('Profile save exception:', e);
      }

      // 3. Send welcome email (non-critical)
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/welcome-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            name: form.name,
            ward_name: form.ward_name,
          }),
        });
      } catch (emailErr) {
        console.log('Welcome email non-critical error:', emailErr);
      }

      // Fallback persistence for demo: save collected profile locally.
      // This ensures Book Water can display name/ward/address even if Supabase profile write/policies are misconfigured.
      try {
        localStorage.setItem(
          'aquagrid_profile_fallback',
          JSON.stringify({
            ...profileData,
            // keep shape consistent with AuthContext usage
            id: data?.user?.id || explicitUserId || null,
          })
        );
      } catch {}

      toast.success(t('auth.registrationSuccess'));
      navigate('/');
    } catch (err) {
  const msg = err.message || '';
  if (msg.includes('not configured') || msg.includes('Database')) {
    toast.error('⚠️ Please add your Supabase credentials to client/.env and restart the dev server.');
  } else if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('User already registered')) {
    toast.error('This email is already registered. Please login instead.');
  } else {
    toast.error(msg || t('auth.registrationError'));
  }
} finally {
  setLoading(false);
}
  };

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  // Helper: show field error
  const FieldError = ({ field }) =>
    errors[field] ? <p className="text-rose-400 text-xs mt-1">{errors[field]}</p> : null;

  const STEPS = [t('auth.stepPersonal'), t('auth.stepLocation'), t('auth.stepAlerts')];

  return (
    <div className="page-wrapper flex items-center justify-center min-h-[80vh] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">{t('auth.createAccount')}</h1>
            <p className="text-slate-400 text-sm mt-1">{t('auth.joinAquaGrid')}</p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= step ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-slate-700'
                }`} />
                <p className={`text-[10px] mt-1 text-center truncate ${
                  i <= step ? 'text-blue-400' : 'text-slate-600'
                }`}>{s}</p>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >

              {/* ── STEP 0: Personal + Account ─────────────────── */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="input-label">{t('auth.fullName')} *</label>
                    <input
                      className={`input-field ${errors.name ? 'border-rose-500/60' : ''}`}
                      placeholder="Priya Sharma"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                    />
                    <FieldError field="name" />
                  </div>

                  <div>
                    <label className="input-label">{t('auth.email')} *</label>
                    <input
                      type="email"
                      className={`input-field ${errors.email ? 'border-rose-500/60' : ''}`}
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                    />
                    <FieldError field="email" />
                  </div>

                  <div>
                    <label className="input-label">{t('auth.phone')} *</label>
                    <div className="flex">
                      <span className="bg-slate-700 border border-blue-800/40 rounded-l-xl px-3 flex items-center text-sm text-slate-400">
                        +91
                      </span>
                      <input
                        className={`input-field !rounded-l-none ${errors.phone ? 'border-rose-500/60' : ''}`}
                        placeholder="9876543210"
                        maxLength={10}
                        value={form.phone}
                        onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <FieldError field="phone" />
                  </div>

                  <div>
                    <label className="input-label">{t('auth.password')} *</label>
                    <input
                      type="password"
                      className={`input-field ${errors.password ? 'border-rose-500/60' : ''}`}
                      placeholder={t('auth.passwordPlaceholder')}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                    />
                    <FieldError field="password" />
                  </div>

                  <div>
                    <label className="input-label">{t('auth.confirmPassword')} *</label>
                    <input
                      type="password"
                      className={`input-field ${errors.confirmPassword ? 'border-rose-500/60' : ''}`}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)}
                    />
                    <FieldError field="confirmPassword" />
                  </div>
                </div>
              )}

              {/* ── STEP 1: Location ──────────────────────────── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <label className="input-label">{t('auth.wardName')} *</label>
                    <input
                      className={`input-field ${errors.ward_name ? 'border-rose-500/60' : ''}`}
                      placeholder={t('auth.searchWard')}
                      value={wardSearch}
                      onChange={e => {
                        setWardSearch(e.target.value);
                        set('ward_name', '');
                        set('ward_number', '');
                        setShowWardList(true);
                      }}
                      onFocus={() => setShowWardList(true)}
                    />
                    <FieldError field="ward_name" />
                    {showWardList && wardSearch && !form.ward_name && filteredWards.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 glass-card max-h-48 overflow-y-auto shadow-xl">
                        {filteredWards.map(w => (
                          <button
                            key={w.id}
                            onClick={() => selectWard(w)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
                          >
                            {w.ward_name}{' '}
                            <span className="text-slate-500">(Ward {w.ward_number})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {form.ward_number && (
                    <div>
                      <label className="input-label">{t('auth.wardNumber')}</label>
                      <input className="input-field bg-slate-800 opacity-70" value={form.ward_number} readOnly />
                    </div>
                  )}

                  <div>
                    <label className="input-label">{t('auth.fullAddress')} *</label>
                    <textarea
                      className={`input-field min-h-[80px] ${errors.address ? 'border-rose-500/60' : ''}`}
                      placeholder={t('auth.addressPlaceholder')}
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                    />
                    <FieldError field="address" />
                  </div>

                  <button onClick={detectLocation} className="btn-secondary w-full text-sm">
                    📍 {t('auth.useLocation')}
                  </button>
                </div>
              )}

              {/* ── STEP 2: Alert Preferences ─────────────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  {[
                    { key: 'alert_email_scarcity', label: t('auth.alertScarcity') },
                    { key: 'alert_email_critical', label: t('auth.alertCritical') },
                    { key: 'alert_booking_reminders', label: t('auth.alertBooking') },
                  ].map(opt => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-3 p-3 glass-card cursor-pointer hover:border-blue-500/40 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form[opt.key]}
                        onChange={e => set(opt.key, e.target.checked)}
                        className="w-5 h-5 rounded bg-slate-700 border-blue-600 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">{opt.label}</span>
                    </label>
                  ))}

                  <div>
                    <label className="input-label">{t('auth.notifFreq')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['immediate', 'daily'].map(f => (
                        <button
                          key={f}
                          onClick={() => set('notification_frequency', f)}
                          className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                            form.notification_frequency === f
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-600/30'
                          }`}
                        >
                          {f === 'immediate' ? `⚡ ${t('auth.immediate')}` : `📋 ${t('auth.daily')}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={prevStep} className="btn-secondary flex-1">
                {t('auth.back')}
              </button>
            )}
            {step < 2 ? (
              <button onClick={nextStep} className="btn-primary flex-1">
                {t('auth.next')}
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? t('auth.creating') : t('auth.create')}
              </button>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            {t('auth.alreadyAccount')}{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}