import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WARDS_DATA } from '../data/wards';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ISSUE_TYPES = [
  { value: 'no_supply',    label: 'No Supply Today',    icon: '🚫', desc: 'No water coming through pipes' },
  { value: 'irregular',    label: 'Irregular Supply',   icon: '🔄', desc: 'Unpredictable water timing' },
  { value: 'low_pressure', label: 'Low Pressure',       icon: '💧', desc: 'Very weak water flow' },
  { value: 'tanker_needed',label: 'Tanker Needed',      icon: '🚛', desc: 'We need tanker delivery' },
  { value: 'other',        label: 'Other',              icon: '📝', desc: 'Something else' },
];

export default function ReportWaterIssue() {
  const { user, profile, isAuthenticated } = useAuth();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wardSearch, setWardSearch] = useState('');
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    ward_name: '',
    ward_id: null,
    report_type: '',
    description: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filteredWards = WARDS_DATA.filter(w =>
    w.ward_name.toLowerCase().includes(wardSearch.toLowerCase())
  );

  const openModal = () => {
    // Pre-fill from profile if logged in
    if (isAuthenticated && profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        ward_name: profile.ward_name || '',
        ward_id: WARDS_DATA.find(w => w.ward_name === profile.ward_name)?.id || null,
        report_type: '',
        description: '',
      });
      setWardSearch(profile.ward_name || '');
    } else {
      setForm({ name: '', phone: '', ward_name: '', ward_id: null, report_type: '', description: '' });
      setWardSearch('');
    }
    setIsOpen(true);
  };

  const selectWard = (w) => {
    set('ward_name', w.ward_name);
    set('ward_id', w.id);
    setWardSearch(w.ward_name);
    setShowWardDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Please enter your name');
    if (!form.phone) return toast.error('Please enter your phone number');
    if (!form.ward_name) return toast.error('Please select a ward');
    if (!form.report_type) return toast.error('Please select the issue type');

    setLoading(true);

    const report = {
      user_id: isAuthenticated ? user?.id : null,
      ward_id: form.ward_id,
      ward_name: form.ward_name,
      reporter_name: form.name,
      reporter_phone: form.phone,
      report_type: form.report_type,
      description: form.description,
      is_anonymous: !isAuthenticated,
    };

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('user_reports').insert(report);
        if (error) throw error;
      }

      // Also send to backend for risk score update
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
      } catch (e) {
        // Non-critical
      }

      toast.success('Report submitted. Thank you for helping your community!');
      setIsOpen(false);
    } catch (err) {
      toast.error('Failed to submit report: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 z-[999] flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
        id="report-water-issue-btn"
      >
        <span className="text-lg">⚠️</span>
        <span className="hidden sm:inline">Report Water Issue</span>
        <span className="sm:hidden">Report</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[1000]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
            >
              <div className="glass-card p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">⚠️ Report Water Issue</h2>
                    <p className="text-sm text-slate-400 mt-1">Help your community by reporting water problems</p>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="input-label">Your Name *</label>
                    <input
                      className="input-field"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="input-label">Phone *</label>
                    <div className="flex">
                      <span className="bg-slate-700 border border-blue-800/40 rounded-l-xl px-3 flex items-center text-sm text-slate-400">+91</span>
                      <input
                        className="input-field !rounded-l-none"
                        placeholder="9876543210"
                        maxLength={10}
                        value={form.phone}
                        onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>

                  {/* Ward */}
                  <div className="relative">
                    <label className="input-label">Ward *</label>
                    <input
                      className="input-field"
                      placeholder="Search ward..."
                      value={wardSearch}
                      onChange={e => {
                        setWardSearch(e.target.value);
                        set('ward_name', '');
                        set('ward_id', null);
                        setShowWardDropdown(true);
                      }}
                      onFocus={() => setShowWardDropdown(true)}
                    />
                    {showWardDropdown && wardSearch && !form.ward_name && filteredWards.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 glass-card max-h-40 overflow-y-auto">
                        {filteredWards.map(w => (
                          <button key={w.id} type="button" onClick={() => selectWard(w)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-blue-500/10 hover:text-blue-300 transition-colors">
                            {w.ward_name} <span className="text-slate-500">(Ward {w.ward_number})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Issue Type */}
                  <div>
                    <label className="input-label">Issue Type *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ISSUE_TYPES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => set('report_type', t.value)}
                          className={`p-3 rounded-xl text-center transition-all border ${
                            form.report_type === t.value
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-600/30'
                          }`}
                        >
                          <div className="text-xl mb-1">{t.icon}</div>
                          <div className="text-xs font-medium">{t.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="input-label">Description (optional)</label>
                    <textarea
                      className="input-field min-h-[80px]"
                      placeholder="Any additional details about the water issue..."
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                    />
                  </div>

                  {/* Anonymous note */}
                  {!isAuthenticated && (
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <span className="text-sm">💡</span>
                      <p className="text-xs text-blue-300">
                        <a href="/register" className="underline font-medium hover:text-blue-200">Register</a> to get early alerts for your ward
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Submitting...' : '📢 Submit Report'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
