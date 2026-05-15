import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const rows = [
  { cat: 'Booking Method', icon: '📝', bbmp: 'Call helpline, long wait', aq: 'Book online in 2 minutes' },
  { cat: 'Delivery Time', icon: '⏱️', bbmp: '3–7 days, unpredictable', aq: 'Confirmed slot within 24 hrs' },
  { cat: 'Live Tracking', icon: '📍', bbmp: 'None', aq: 'Real-time status updates' },
  { cat: 'Early Warning', icon: '🔔', bbmp: 'None', aq: 'Email alert 3–5 days ahead' },
  { cat: 'Payment Options', icon: '💳', bbmp: 'Cash only', aq: 'Online + Cash on delivery' },
  { cat: 'Support', icon: '🎧', bbmp: 'Office hours only', aq: '24/7 via chat' },
  { cat: 'Ward-Level Data', icon: '📊', bbmp: 'None', aq: 'Live risk map + 7-day forecast' },
  { cat: 'User Reports', icon: '📢', bbmp: 'Not accepted', aq: 'Crowd-sourced + AI verified' },
];

export default function Compare() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="page-wrapper section-container py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why Choose <span className="text-gradient">AquaGrid</span>?
          </h1>
          <p className="text-slate-400 text-lg">See how AquaGrid compares to traditional BBMP/BWSSB water services</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-4 px-4">
            <div className="text-sm font-semibold text-slate-500 uppercase">Feature</div>
            <div className="text-center"><span className="px-4 py-2 rounded-xl bg-slate-700/60 border border-slate-600/40 text-sm font-semibold text-slate-400 inline-block">BBMP / BWSSB</span></div>
            <div className="text-center"><span className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-500/40 text-sm font-semibold text-gradient inline-block">💧 AquaGrid</span></div>
          </div>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="grid grid-cols-3 gap-4 items-center glass-card p-4 hover:border-blue-600/50 transition-colors">
                <div className="flex items-center gap-3"><span className="text-xl">{r.icon}</span><span className="text-sm font-medium text-slate-300">{r.cat}</span></div>
                <div className="text-center"><span className="text-sm text-slate-500 bg-slate-800/60 px-3 py-1.5 rounded-lg inline-block">{r.bbmp}</span></div>
                <div className="text-center"><span className="text-sm text-cyan-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg inline-block font-medium">{r.aq}</span></div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="text-center mt-12">
          <Link to={isAuthenticated ? '/book-water' : '/register'} className="btn-primary text-lg !px-8 !py-4 inline-flex items-center gap-2">
            🚰 Book Water with AquaGrid
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
