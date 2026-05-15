import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MOCK_ADMIN_STATS } from '../../data/mockData';
import { WARDS_DATA } from '../../data/wards';

const statCards = [
  { label: 'Bookings Today', value: MOCK_ADMIN_STATS.totalBookingsToday, icon: '📦', color: 'text-blue-400' },
  { label: 'Pending Orders', value: MOCK_ADMIN_STATS.pendingOrders, icon: '⏳', color: 'text-amber-400' },
  { label: 'Out for Delivery', value: MOCK_ADMIN_STATS.outForDelivery, icon: '🚛', color: 'text-cyan-400' },
  { label: 'Delivered Today', value: MOCK_ADMIN_STATS.deliveredToday, icon: '✅', color: 'text-emerald-400' },
  { label: 'Active Users', value: MOCK_ADMIN_STATS.activeUsers, icon: '👥', color: 'text-blue-300' },
  { label: 'Reports Today', value: MOCK_ADMIN_STATS.reportsToday, icon: '📢', color: 'text-amber-300' },
  { label: 'Avg Risk Score', value: MOCK_ADMIN_STATS.avgRiskScore, icon: '📊', color: 'text-rose-400' },
];

const quickLinks = [
  { to: '/admin/orders', label: 'Manage Orders', icon: '📋', desc: 'View and update all bookings' },
  { to: '/admin/map', label: 'Risk Map', icon: '🗺️', desc: 'Ward risk management' },
  { to: '/admin/users', label: 'Users', icon: '👥', desc: 'Manage registered users' },
];

export default function Dashboard() {
  const criticalWards = WARDS_DATA.filter(w => w.risk_level === 'critical');
  const orangeWards = WARDS_DATA.filter(w => w.risk_level === 'orange');

  return (
    <div className="page-wrapper section-container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">AquaGrid Operations Overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 text-center hover:border-blue-500/40 transition-colors">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {quickLinks.map((l, i) => (
            <Link key={i} to={l.to} className="glass-card-hover p-5 flex items-center gap-4">
              <span className="text-3xl">{l.icon}</span>
              <div>
                <div className="text-sm font-semibold text-white">{l.label}</div>
                <div className="text-xs text-slate-400">{l.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Risk alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-rose-400 mb-3">🚨 Critical Wards ({criticalWards.length})</h3>
            <div className="space-y-2">
              {criticalWards.map(w => (
                <div key={w.id} className="flex justify-between items-center p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  <span className="text-sm text-white">{w.ward_name}</span>
                  <span className="text-sm font-bold text-rose-400">{w.risk_score}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-amber-400 mb-3">⚠️ High Risk Wards ({orangeWards.length})</h3>
            <div className="space-y-2">
              {orangeWards.map(w => (
                <div key={w.id} className="flex justify-between items-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <span className="text-sm text-white">{w.ward_name}</span>
                  <span className="text-sm font-bold text-amber-400">{w.risk_score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
