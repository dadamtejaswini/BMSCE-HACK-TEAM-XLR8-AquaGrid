import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { MOCK_BOOKINGS } from '../data/mockData';
import { STATUS_STEPS, STATUS_CONFIG, TIME_SLOTS, QUANTITY_OPTIONS } from '../data/wards';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import QueryModal from '../components/QueryModal';

function StatusStepper({ currentStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="flex items-center gap-1 mt-4">
      {STATUS_STEPS.map((step, i) => {
        const config = STATUS_CONFIG[step];
        const isComplete = i <= currentIdx && !isCancelled;
        const isCurrent = i === currentIdx && !isCancelled;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className={`flex flex-col items-center flex-1`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isComplete ? config.color + ' text-white' : 'bg-slate-700 text-slate-500'}
                ${isCurrent && step === 'out_for_delivery' ? 'animate-pulse' : ''}`}>
                {isComplete ? config.icon : i + 1}
              </div>
              <span className={`text-[9px] mt-1 text-center ${isComplete ? 'text-slate-300' : 'text-slate-600'}`}>{config.label}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 w-full mx-1 rounded ${i < currentIdx ? 'bg-blue-500' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState({});
  const [queryModal, setQueryModal] = useState({ open: false, bookingId: null });

  useEffect(() => {
    const fetchBookings = async () => {
      if (isSupabaseConfigured && profile?.id && profile.id !== 'demo-user') {
        try {
          const { data, error } = await supabase
            .from('water_bookings')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          setBookings(data && data.length > 0 ? data : MOCK_BOOKINGS);

          // Check which bookings have feedback
          if (data && data.length > 0) {
            const bookingIds = data.filter(b => b.status === 'delivered').map(b => b.id);
            if (bookingIds.length > 0) {
              const { data: fbData } = await supabase
                .from('feedback')
                .select('booking_id')
                .in('booking_id', bookingIds);
              const fbMap = {};
              fbData?.forEach(f => { fbMap[f.booking_id] = true; });
              setFeedbackSubmitted(fbMap);
            }
          }
        } catch {
          setBookings(MOCK_BOOKINGS);
        }
      } else {
        setBookings(MOCK_BOOKINGS);
      }
      setLoading(false);
    };
    fetchBookings();

    // Realtime subscription
    if (isSupabaseConfigured && profile?.id) {
      const channel = supabase
        .channel('bookings-updates')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'water_bookings', filter: `user_id=eq.${profile.id}` },
          (payload) => {
            setBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
          }
        ).subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [profile]);

  if (loading) return (
    <div className="page-wrapper section-container py-12">
      <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-40" />)}</div>
    </div>
  );

  return (
    <div className="page-wrapper section-container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Orders</h1>
            <p className="text-slate-400 text-sm">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/book-water" className="btn-primary text-sm">+ New Booking</Link>
        </div>

        {bookings.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-white mb-2">No bookings yet</h3>
            <p className="text-slate-400 text-sm mb-6">Book your first water delivery</p>
            <Link to="/book-water" className="btn-primary inline-block">🚰 Book Water</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
              const qty = QUANTITY_OPTIONS.find(q => q.value === b.quantity);
              const slot = TIME_SLOTS.find(s => s.value === b.delivery_slot);
              const hasFeedback = feedbackSubmitted[b.id];
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-mono font-bold text-cyan-400">{b.booking_id}</span>
                        <span className={`badge ${b.status === 'delivered' ? 'badge-green' : b.status === 'out_for_delivery' ? 'badge-cyan' : b.status === 'cancelled' ? 'badge-rose' : b.status === 'confirmed' ? 'badge-blue' : 'badge-amber'}`}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{b.ward_name} • {qty?.label || b.quantity}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        📅 {b.delivery_date} • {slot?.time || b.delivery_slot}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      {qty && <div className="text-lg font-bold text-cyan-400">₹{qty.price}</div>}
                      {b.status === 'delivered' && !hasFeedback && (
                        <Link to={`/feedback/${b.id}`} className="inline-block text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
                          ⭐ Leave Feedback
                        </Link>
                      )}
                      {hasFeedback && (
                        <span className="text-xs text-emerald-400">✅ Feedback submitted</span>
                      )}
                      <div>
                        <button
                          onClick={() => setQueryModal({ open: true, bookingId: b.booking_id })}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                          📞 Raise a Query
                        </button>
                      </div>
                    </div>
                  </div>
                  <StatusStepper currentStatus={b.status} />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <QueryModal
        isOpen={queryModal.open}
        onClose={() => setQueryModal({ open: false, bookingId: null })}
        bookingId={queryModal.bookingId}
      />
    </div>
  );
}
