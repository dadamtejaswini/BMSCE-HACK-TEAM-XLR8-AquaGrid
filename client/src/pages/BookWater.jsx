import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WARDS_DATA, RISK_COLORS, QUANTITY_OPTIONS, TIME_SLOTS } from '../data/wards';
import { generateBookingId } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import QueryModal from '../components/QueryModal';

const API_URL = import.meta.env.VITE_API_URL;

export default function BookWater() {
  const { profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const [wardSearch, setWardSearch] = useState('');
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  const [form, setForm] = useState({
    ward_name: profile?.ward_name || '',
    address: profile?.address || '',
    quantity: '',
    delivery_date: '',
    delivery_slot: '',
    payment_method: '',
    special_notes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        address: profile.address || '',
        ward_name: profile.ward_name || '',
      }));
      if (profile.ward_name) setWardSearch(profile.ward_name);
    }
  }, [profile]);

  const selectedWard = WARDS_DATA.find(w => w.ward_name === form.ward_name);

  const filteredWards = WARDS_DATA.filter(w =>
    w.ward_name.toLowerCase().includes(wardSearch.toLowerCase())
  );

  const selectWard = (w) => {
    set('ward_name', w.ward_name);
    setWardSearch(w.ward_name);
    setShowWardDropdown(false);
  };

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ward_name) return toast.error('Please select your ward');
    if (!form.address.trim()) return toast.error('Please enter delivery address');
    if (!form.quantity) return toast.error('Please select quantity');
    if (!form.delivery_date) return toast.error('Please select delivery date');
    if (!form.delivery_slot) return toast.error('Please select a time slot');
    if (!form.payment_method) return toast.error('Please select payment method');

    setLoading(true);
    const bookingId = generateBookingId();

    const booking = {
      user_id: profile?.id || null,
      ward_name: form.ward_name,
      address: form.address,
      quantity: form.quantity,
      delivery_date: form.delivery_date,
      delivery_slot: form.delivery_slot,
      payment_method: form.payment_method,
      special_notes: form.special_notes,
      status: 'pending',
      booking_id: bookingId,
    };

    try {
      if (API_URL) {
        const res = await fetch(`${API_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking),
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
           if (result.error && result.error.includes('Could not find the table')) {
             console.warn('Backend table "water_bookings" missing. Using localStorage fallback.');
           } else {
             throw new Error(result.error || 'Booking failed');
           }
        }
      } else if (isSupabaseConfigured) {
        const { error } = await supabase.from('water_bookings').insert(booking);
        if (error) {
          if (error.message.includes('Could not find the table')) {
            console.warn('Supabase table "water_bookings" missing. Using localStorage fallback.');
          } else {
            throw error;
          }
        }
      } else {
        console.warn('No booking service available. Using localStorage fallback.');
      }

      // Save to localStorage fallback for demo
      try {
        const localBookings = JSON.parse(localStorage.getItem('aquagrid_bookings_fallback') || '[]');
        localBookings.unshift({ 
          ...booking, 
          id: booking.booking_id, // Use booking_id as temporary ID
          created_at: new Date().toISOString() 
        });
        localStorage.setItem('aquagrid_bookings_fallback', JSON.stringify(localBookings.slice(0, 50)));
      } catch (e) {
        console.error('Failed to save to local storage', e);
      }

      setLoading(false);
      toast.success(`Booking ${bookingId} created successfully!`);
      navigate('/my-orders');
    } catch (error) {
      setLoading(false);
      toast.error('Booking failed: ' + (error.message || 'Please try again'));
    }
  };

  const selectedQty = QUANTITY_OPTIONS.find(q => q.value === form.quantity);

  return (
    <div className="page-wrapper section-container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">

        <h1 className="text-2xl font-bold text-white mb-8">🚰 Book Water Delivery</h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Ward Selector ─────────────────────────────── */}
          <div>
            <label className="input-label">Select Your Ward *</label>
            <div className="relative">
              <input
                type="text"
                className="input-field pr-10"
                placeholder="Search and select your ward..."
                value={wardSearch}
                onChange={e => {
                  setWardSearch(e.target.value);
                  set('ward_name', '');
                  setShowWardDropdown(true);
                }}
                onFocus={() => setShowWardDropdown(true)}
              />
              {/* clear */}
              {wardSearch && (
                <button
                  type="button"
                  onClick={() => { setWardSearch(''); set('ward_name', ''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-lg"
                >×</button>
              )}

              {/* Dropdown */}
              {showWardDropdown && wardSearch && filteredWards.length > 0 && !form.ward_name && (
                <div className="absolute z-30 w-full mt-1 bg-[#1a3247] border border-[#3E5F78] rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                  {filteredWards.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => selectWard(w)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-blue-500/10 hover:text-blue-300 transition-colors flex justify-between items-center"
                    >
                      <span>{w.ward_name}</span>
                      <span className={`text-xs font-bold ${RISK_COLORS[w.risk_level]?.text}`}>
                        Risk: {w.risk_score}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected ward risk badge */}
            {selectedWard && (
              <div
                className="mt-3 p-3 rounded-xl border-l-4 bg-[#132A3A] flex items-center justify-between"
                style={{ borderLeftColor: RISK_COLORS[selectedWard.risk_level]?.fill }}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{selectedWard.ward_name}</p>
                  <p className="text-xs text-slate-400">Ward #{selectedWard.ward_number}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${RISK_COLORS[selectedWard.risk_level]?.text}`}>
                    {selectedWard.risk_score}
                  </span>
                  <p className="text-xs text-slate-400">risk score</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Delivery Address ──────────────────────────── */}
          <div>
            <label className="input-label">Delivery Address *</label>
            <textarea
              className="input-field min-h-[80px]"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Full delivery address (street, area, landmark)"
            />
          </div>

          {/* ── Quantity ──────────────────────────────────── */}
          <div>
            <label className="input-label">Quantity *</label>
            <div className="grid grid-cols-3 gap-3">
              {QUANTITY_OPTIONS.map(q => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => set('quantity', q.value)}
                  className={`p-4 rounded-xl text-center transition-all border ${
                    form.quantity === q.value
                      ? 'bg-blue-500/20 border-blue-500/50 glow-blue'
                      : 'bg-slate-800 border-slate-700 hover:border-blue-600/30'
                  }`}
                >
                  <div className="text-2xl mb-1">{q.icon}</div>
                  <div className="text-sm font-medium text-white">{q.label}</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">₹{q.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Date ─────────────────────────────────────── */}
          <div>
            <label className="input-label">Preferred Date *</label>
            <input
              type="date"
              className="input-field"
              min={tomorrow}
              max={maxDate}
              value={form.delivery_date}
              onChange={e => set('delivery_date', e.target.value)}
            />
          </div>

          {/* ── Time Slot ─────────────────────────────────── */}
          <div>
            <label className="input-label">Time Slot *</label>
            <div className="grid grid-cols-3 gap-3">
              {TIME_SLOTS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('delivery_slot', s.value)}
                  className={`p-3 rounded-xl text-center transition-all border ${
                    form.delivery_slot === s.value
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-slate-800 border-slate-700 hover:border-blue-600/30'
                  }`}
                >
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-xs font-medium text-white">{s.label}</div>
                  <div className="text-[10px] text-slate-400">{s.time}</div>
                </button>
              ))}
            </div>
          </div>


          {/* ── Special Notes ─────────────────────────────── */}
          <div>
            <label className="input-label">Special Notes (optional)</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.special_notes}
              onChange={e => set('special_notes', e.target.value)}
              placeholder="Any special delivery instructions..."
            />
          </div>

          {/* ── Order Summary ─────────────────────────────── */}
          {selectedQty && form.delivery_date && form.ward_name && (
            <div className="glass-card p-4 border-cyan-500/20">
              <h3 className="text-sm font-semibold text-white mb-3">📋 Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ward</span>
                  <span className="text-white">{form.ward_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity</span>
                  <span className="text-white">{selectedQty.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date</span>
                  <span className="text-white">{form.delivery_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slot</span>
                  <span className="text-white capitalize">{form.delivery_slot}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span className="text-slate-300 font-medium">Total</span>
                  <span className="text-cyan-400 font-bold text-lg">₹{selectedQty.price}</span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full text-lg">
            {loading ? '⏳ Placing Order...' : '🚰 Confirm Booking'}
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