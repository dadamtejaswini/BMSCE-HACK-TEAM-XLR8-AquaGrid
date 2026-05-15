import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WARDS_DATA, findNearestWard } from '../data/wards';

const STEPS = ['Personal Info', 'Location', 'Verification', 'Alert Preferences'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { signUp, saveProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    name: '', phone: '',
    ward_name: '', ward_number: '', address: '',
    aadhaar_last4: '',
    alert_email_scarcity: true, alert_email_critical: true,
    alert_booking_reminders: true, notification_frequency: 'immediate',
  });

  const [wardSearch, setWardSearch] = useState('');
  const filteredWards = WARDS_DATA.filter(w => w.ward_name.toLowerCase().includes(wardSearch.toLowerCase()));

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectWard = (w) => {
    set('ward_name', w.ward_name);
    set('ward_number', w.ward_number);
    setWardSearch(w.ward_name);
  };

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        const nearest = findNearestWard(pos.coords.latitude, pos.coords.longitude);
        if (nearest) { selectWard(nearest); toast.success(`Detected: ${nearest.ward_name}`); }
      }, () => toast.error('Could not detect location'));
    }
  };

  const nextStep = () => {
    if (step === 0) {
      if (!form.email || !form.password) return toast.error('Fill all required fields');
      if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
      if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    }
    if (step === 1 && !form.ward_name) return toast.error('Please select a ward');
    setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data, error } = await signUp(form.email, form.password);
      if (error) throw error;
      if (!data.user) throw new Error('Registration failed — no user returned');

      const profileData = {
        name: form.name, phone: form.phone, email: form.email,
        ward_name: form.ward_name, ward_number: form.ward_number,
        address: form.address, aadhaar_last4: form.aadhaar_last4,
        alert_on_scarcity: form.alert_email_scarcity,
        alert_on_critical: form.alert_email_critical,
        booking_reminders: form.alert_booking_reminders,
        notification_frequency: form.notification_frequency,
      };

      const { error: profileError } = await saveProfile(profileData, data.user.id);
      if (profileError) {
        console.error('Profile save error:', profileError);
        toast.warning('Account created but profile save failed. You can update your profile later.');
      }

      // Send welcome email via backend
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
        console.log('Welcome email send failed (non-critical):', emailErr);
      }

      setLoading(false);
      toast.success('Registration successful! Welcome to AquaGrid.');
      navigate('/');
    } catch (err) {
      setLoading(false);
      toast.error(err.message || 'Registration failed. Please try again.');
    }
  };

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  return (
    <div className="page-wrapper flex items-center justify-center min-h-[80vh] px-4 py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
            <p className="text-slate-400 text-sm mt-1">Join AquaGrid for early water alerts</p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-slate-700'}`} />
                <p className={`text-[10px] mt-1 text-center ${i <= step ? 'text-blue-400' : 'text-slate-600'}`}>{s}</p>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              {/* Step 0: Account + Personal */}
              {step === 0 && (
                <div className="space-y-4">
                  <div><label className="input-label">Full Name *</label><input className="input-field" placeholder="Priya Sharma" value={form.name} onChange={e => set('name', e.target.value)} /></div>
                  <div><label className="input-label">Email *</label><input type="email" className="input-field" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
                  <div><label className="input-label">Phone *</label>
                    <div className="flex"><span className="bg-slate-700 border border-blue-800/40 rounded-l-xl px-3 flex items-center text-sm text-slate-400">+91</span>
                    <input className="input-field !rounded-l-none" placeholder="9876543210" maxLength={10} value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} /></div>
                  </div>
                  <div><label className="input-label">Password *</label><input type="password" className="input-field" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} /></div>
                  <div><label className="input-label">Confirm Password *</label><input type="password" className="input-field" placeholder="••••••••" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} /></div>
                </div>
              )}

              {/* Step 1: Location */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <label className="input-label">Ward Name *</label>
                    <input className="input-field" placeholder="Search ward..." value={wardSearch} onChange={e => { setWardSearch(e.target.value); set('ward_name', ''); }} />
                    {wardSearch && !form.ward_name && filteredWards.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 glass-card max-h-48 overflow-y-auto">
                        {filteredWards.map(w => (
                          <button key={w.id} onClick={() => selectWard(w)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-blue-500/10 hover:text-blue-300 transition-colors">
                            {w.ward_name} <span className="text-slate-500">(Ward {w.ward_number})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {form.ward_number && <div><label className="input-label">Ward Number</label><input className="input-field bg-slate-800" value={form.ward_number} readOnly /></div>}
                  <div><label className="input-label">Full Address</label><textarea className="input-field min-h-[80px]" placeholder="Street, Area, PIN code" value={form.address} onChange={e => set('address', e.target.value)} /></div>
                  <button onClick={detectLocation} className="btn-secondary w-full text-sm">📍 Use My Current Location</button>
                </div>
              )}

              {/* Step 2: Verification */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
                    <p className="text-sm text-amber-300 mb-1">Optional Verification</p>
                    <p className="text-xs text-slate-400">Helps us verify genuine residents and prevent misuse of the booking system</p>
                  </div>
                  <div><label className="input-label">Aadhaar Last 4 Digits (optional)</label><input className="input-field" placeholder="XXXX" maxLength={4} value={form.aadhaar_last4} onChange={e => set('aadhaar_last4', e.target.value.replace(/\D/g, ''))} /></div>
                </div>
              )}

              {/* Step 3: Alerts */}
              {step === 3 && (
                <div className="space-y-4">
                  {[
                    { key: 'alert_email_scarcity', label: 'Email me when scarcity is detected in my ward' },
                    { key: 'alert_email_critical', label: 'Email me when scarcity is critical' },
                    { key: 'alert_booking_reminders', label: 'Send booking reminders' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-3 p-3 glass-card cursor-pointer hover:border-blue-500/40 transition-colors">
                      <input type="checkbox" checked={form[opt.key]} onChange={e => set(opt.key, e.target.checked)}
                        className="w-5 h-5 rounded bg-slate-700 border-blue-600 text-blue-500 focus:ring-blue-500" />
                      <span className="text-sm text-slate-300">{opt.label}</span>
                    </label>
                  ))}
                  <div><label className="input-label">Notification Frequency</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['immediate', 'daily'].map(f => (
                        <button key={f} onClick={() => set('notification_frequency', f)}
                          className={`p-3 rounded-xl text-sm font-medium transition-all border ${form.notification_frequency === f ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-600/30'}`}>
                          {f === 'immediate' ? '⚡ Immediate Alerts' : '📋 Daily Digest'}
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
            {step > 0 && <button onClick={prevStep} className="btn-secondary flex-1">Back</button>}
            {step < 3 ? (
              <button onClick={nextStep} className="btn-primary flex-1">Next</button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
