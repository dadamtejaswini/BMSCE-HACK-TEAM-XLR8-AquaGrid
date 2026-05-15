import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const QUERY_TYPES = [
  { value: 'booking_related', label: 'Booking Related', icon: '📦' },
  { value: 'delivery_issue', label: 'Delivery Issue', icon: '🚛' },
  { value: 'water_quality', label: 'Water Quality', icon: '💧' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export default function QueryModal({ isOpen, onClose, bookingId = null }) {
  const { user, profile, isAuthenticated } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    email: profile?.email || user?.email || '',
    query_type: bookingId ? 'booking_related' : '',
    message: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.message) return toast.error('Please fill name and message');

    setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: isAuthenticated ? user?.id : null,
          booking_id: bookingId,
          name: form.name,
          phone: form.phone,
          email: form.email,
          query_type: form.query_type,
          message: form.message,
        }),
      });
      toast.success('Query submitted successfully. We\'ll get back within 24 hours.');
      onClose();
    } catch (err) {
      toast.error('Failed to submit query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[1000]"
            onClick={onClose}
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
                  <h2 className="text-xl font-bold text-white">📞 Raise a Query</h2>
                  <p className="text-sm text-slate-400 mt-1">We'll get back within 24 hours</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>

              {bookingId && (
                <div className="glass-card p-3 mb-4 border-cyan-500/20">
                  <p className="text-xs text-slate-400">Related Booking</p>
                  <p className="text-sm font-mono text-cyan-400">{bookingId}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="input-label">Name *</label>
                  <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="input-label">Phone</label>
                  <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Query Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {QUERY_TYPES.map(t => (
                      <button key={t.value} type="button" onClick={() => set('query_type', t.value)}
                        className={`p-3 rounded-xl text-center transition-all border ${
                          form.query_type === t.value
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-600/30'
                        }`}>
                        <span className="text-lg">{t.icon}</span>
                        <div className="text-xs font-medium mt-1">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="input-label">Message *</label>
                  <textarea className="input-field min-h-[100px]" value={form.message} onChange={e => set('message', e.target.value)} required
                    placeholder="Describe your issue in detail..." />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Submitting...' : '📤 Submit Query'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
