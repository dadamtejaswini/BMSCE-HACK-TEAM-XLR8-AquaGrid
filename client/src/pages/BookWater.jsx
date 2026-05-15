import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WARDS_DATA, RISK_COLORS, QUANTITY_OPTIONS, TIME_SLOTS } from '../data/wards';
import { generateBookingId } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import QueryModal from '../components/QueryModal';

export default function BookWater() {
  const { profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);

  const ward = WARDS_DATA.find(w => w.ward_name === profile?.ward_name) || WARDS_DATA[0];

  const [form, setForm] = useState({
    address: profile?.address || '',
    quantity: '',
    delivery_date: '',
    delivery_slot: '',
    payment_method: '',
    special_notes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantity || !form.delivery_date || !form.delivery_slot || !form.payment_method) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    const bookingId = generateBookingId();
    const booking = {
      user_id: profile?.id || 'demo-user',
      ward_name: ward.ward_name,
      address: form.address,
      quantity: form.quantity,
      delivery_date: form.delivery_date,
      delivery_slot: form.delivery_slot,
      payment_method: form.payment_method,
      special_notes: form.special_notes,
      status: 'pending',
      booking_id: bookingId,
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('water_bookings').insert(booking);
      if (error) { toast.error('Booking failed: ' + error.message); setLoading(false); return; }
    }

    setLoading(false);
    toast.success(`Booking ${bookingId} created successfully!`);
    navigate('/my-orders');
  };

  const selectedQty = QUANTITY_OPTIONS.find(q => q.value === form.quantity);

  return (
    <div className="page-wrapper section-container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        {/* Ward risk banner */}
        <div className={`glass-card p-4 mb-8 flex items-center justify-between border-l-4`} style={{ borderLeftColor: RISK_COLORS[ward.risk_level]?.fill }}>
          <div>
            <p className="text-sm text-slate-400">Your ward: <span className="text-white font-medium">{ward.ward_name}</span></p>
            <p className="text-xs text-slate-500">Current risk level</p>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${RISK_COLORS[ward.risk_level]?.text}`}>{ward.risk_score}</span>
            <span className={`block badge mt-1 ${ward.risk_level === 'critical' ? 'badge-rose' : ward.risk_level === 'orange' ? 'badge-amber' : ward.risk_level === 'blue' ? 'badge-blue' : 'badge-green'}`}>
              {RISK_COLORS[ward.risk_level]?.label}
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-6">🚰 Book Water Delivery</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Address */}
          <div>
            <label className="input-label">Delivery Address *</label>
            <textarea className="input-field min-h-[80px]" value={form.address} onChange={e => set('address', e.target.value)} required placeholder="Full delivery address" />
          </div>

          {/* Quantity */}
          <div>
            <label className="input-label">Quantity *</label>
            <div className="grid grid-cols-3 gap-3">
              {QUANTITY_OPTIONS.map(q => (
                <button key={q.value} type="button" onClick={() => set('quantity', q.value)}
                  className={`p-4 rounded-xl text-center transition-all border ${form.quantity === q.value ? 'bg-blue-500/20 border-blue-500/50 glow-blue' : 'bg-slate-800 border-slate-700 hover:border-blue-600/30'}`}>
                  <div className="text-2xl mb-1">{q.icon}</div>
                  <div className="text-sm font-medium text-white">{q.label}</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">₹{q.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="input-label">Preferred Date *</label>
            <input type="date" className="input-field" min={tomorrow} max={maxDate} value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} required />
          </div>

          {/* Time slot */}
          <div>
            <label className="input-label">Time Slot *</label>
            <div className="grid grid-cols-3 gap-3">
              {TIME_SLOTS.map(s => (
                <button key={s.value} type="button" onClick={() => set('delivery_slot', s.value)}
                  className={`p-3 rounded-xl text-center transition-all border ${form.delivery_slot === s.value ? 'bg-blue-500/20 border-blue-500/50' : 'bg-slate-800 border-slate-700 hover:border-blue-600/30'}`}>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-xs font-medium text-white">{s.label}</div>
                  <div className="text-[10px] text-slate-400">{s.time}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div>
            <label className="input-label">Payment Method *</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ value: 'online', label: '💳 Pay Online', sub: 'Razorpay' }, { value: 'cash', label: '💵 Cash on Delivery', sub: 'Pay on delivery' }].map(p => (
                <button key={p.value} type="button" onClick={() => set('payment_method', p.value)}
                  className={`p-4 rounded-xl text-left transition-all border ${form.payment_method === p.value ? 'bg-blue-500/20 border-blue-500/50' : 'bg-slate-800 border-slate-700 hover:border-blue-600/30'}`}>
                  <div className="text-sm font-medium text-white">{p.label}</div>
                  <div className="text-xs text-slate-400">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="input-label">Special Notes (optional)</label>
            <textarea className="input-field" rows={2} value={form.special_notes} onChange={e => set('special_notes', e.target.value)} placeholder="Any special delivery instructions..." />
          </div>

          {/* Summary */}
          {selectedQty && form.delivery_date && (
            <div className="glass-card p-4 border-cyan-500/20">
              <h3 className="text-sm font-semibold text-white mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Quantity</span><span className="text-white">{selectedQty.label}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Date</span><span className="text-white">{form.delivery_date}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Slot</span><span className="text-white capitalize">{form.delivery_slot}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-slate-300 font-medium">Total</span><span className="text-cyan-400 font-bold text-lg">₹{selectedQty.price}</span></div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full text-lg">
            {loading ? 'Placing Order...' : '🚰 Confirm Booking'}
          </button>
        </form>

        {/* Helpline + Query */}
        <div className="glass-card p-5 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div>
              <p className="text-sm font-medium text-white">Helpline: +91 98765 43210</p>
              <p className="text-xs text-slate-400">Available 7 AM – 10 PM</p>
            </div>
          </div>
          <button onClick={() => setQueryOpen(true)} className="btn-secondary text-sm">
            📝 Raise a Query
          </button>
        </div>
      </motion.div>

      <QueryModal isOpen={queryOpen} onClose={() => setQueryOpen(false)} />
    </div>
  );
}
