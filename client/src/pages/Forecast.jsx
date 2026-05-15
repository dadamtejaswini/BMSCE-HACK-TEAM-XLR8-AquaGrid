import { useState } from 'react';
import { motion } from 'framer-motion';
import { WARDS_DATA, RISK_COLORS } from '../data/wards';
import { generateForecastData } from '../data/mockData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Forecast() {
  const [selectedWard, setSelectedWard] = useState(WARDS_DATA[0]);
  const data = generateForecastData(selectedWard);

  return (
    <div className="page-wrapper section-container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">7-Day Water Forecast</h1>
            <p className="text-slate-400 text-sm">Predicted risk levels for Bengaluru wards</p>
          </div>
          <select value={selectedWard.id} onChange={e => setSelectedWard(WARDS_DATA.find(w => w.id === +e.target.value))}
            className="input-field max-w-xs">
            {WARDS_DATA.map(w => <option key={w.id} value={w.id}>{w.ward_name} — Score: {w.risk_score}</option>)}
          </select>
        </div>

        {/* Current status */}
        <div className={`glass-card p-6 mb-8 border-l-4`} style={{ borderLeftColor: RISK_COLORS[selectedWard.risk_level]?.fill }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedWard.ward_name}</h2>
              <p className="text-sm text-slate-400">Ward {selectedWard.ward_number} • {selectedWard.zone} Zone</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${RISK_COLORS[selectedWard.risk_level]?.text}`}>{selectedWard.risk_score}</div>
              <div className="text-xs text-slate-400">Risk Score</div>
              <span className={`badge mt-1 ${selectedWard.risk_level === 'critical' ? 'badge-rose' : selectedWard.risk_level === 'orange' ? 'badge-amber' : selectedWard.risk_level === 'blue' ? 'badge-blue' : 'badge-green'}`}>
                {RISK_COLORS[selectedWard.risk_level]?.label}
              </span>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${selectedWard.risk_score}%`, backgroundColor: RISK_COLORS[selectedWard.risk_level]?.fill }} />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-4">Risk Score Trend</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="riskGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="riskScore" stroke="#3B82F6" fill="url(#riskGrad2)" strokeWidth={2} name="Risk Score" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-4">Rainfall & Reports</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '12px' }} />
                  <Legend />
                  <Bar dataKey="rainfall" fill="#06B6D4" name="Rainfall (mm)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reports" fill="#F59E0B" name="Reports" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Daily breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Daily Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {data.map((d, i) => (
              <div key={i} className={`p-4 rounded-xl text-center border transition-all ${d.riskScore > 75 ? 'bg-rose-500/10 border-rose-500/30' : d.riskScore > 50 ? 'bg-amber-500/10 border-amber-500/30' : d.riskScore > 25 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <div className="text-xs text-slate-400">{d.day}</div>
                <div className="text-xs text-slate-500">{d.date}</div>
                <div className={`text-2xl font-bold mt-2 ${d.riskScore > 75 ? 'text-rose-400' : d.riskScore > 50 ? 'text-amber-400' : d.riskScore > 25 ? 'text-blue-400' : 'text-emerald-400'}`}>{d.riskScore}</div>
                <div className="text-xs text-slate-500 mt-1">🌧 {d.rainfall}mm</div>
                <div className="text-xs text-slate-500">💧 {d.reservoirLevel}%</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
