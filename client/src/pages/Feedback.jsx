import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MOCK_BOOKINGS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Feedback() {
  const { bookingId } = useParams();
  const { profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [displayPublic, setDisplayPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    // Verify booking exists and is delivered
    if (isSupabaseConfigured) {
      supabase.from('water_bookings').select('*').eq('id', bookingId).single()
        .then(({ data }) => {
          if (!data || data.status !== 'delivered' || data.user_id !== profile?.id) navigate('/my-orders');
          else setBooking(data);
        });
    } else {
      const b = MOCK_BOOKINGS.find(b => b.id === bookingId);
      if (!b || b.status !== 'delivered') navigate('/my-orders');
      else setBooking(b);
    }
  }, [bookingId, profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error('Please select a rating');
    setLoading(true);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('feedback').insert({
        user_id: profile?.id,
        booking_id: bookingId,
        rating, comment, display_public: displayPublic,
      });
      if (error) { toast.error(error.message); setLoading(false); return; }
    }

    setLoading(false);
    setSubmitted(true);
    setTimeout(() => navigate('/my-orders'), 3000);
  };

  if (submitted) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.8 }}
            className="text-6xl mb-4">🎉</motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-slate-400">Your feedback helps us improve. Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="page-wrapper section-container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Leave Feedback</h1>
          <p className="text-sm text-slate-400 mb-6">Order {booking.booking_id}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star rating */}
            <div className="text-center">
              <label className="input-label text-center">How was your experience?</label>
              <div className="flex justify-center gap-2 mt-2 star-rating">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button"
                    onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(s)}
                    className={`text-4xl transition-all star ${s <= (hover || rating) ? (s <= rating ? 'filled' : 'hovered') : ''}`}>
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-slate-400 mt-2">
                  {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good!' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
                </p>
              )}
            </div>

            <div>
              <label className="input-label">Tell us about your experience</label>
              <textarea className="input-field min-h-[100px]" value={comment} onChange={e => setComment(e.target.value)}
                placeholder="How was the delivery? Water quality? Timing?" />
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 glass-card hover:border-blue-500/40 transition-colors">
              <input type="checkbox" checked={displayPublic} onChange={e => setDisplayPublic(e.target.checked)}
                className="w-5 h-5 rounded bg-slate-700 border-blue-600 text-blue-500 focus:ring-blue-500" />
              <span className="text-sm text-slate-300">Show my feedback publicly</span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Submitting...' : '⭐ Submit Feedback'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
