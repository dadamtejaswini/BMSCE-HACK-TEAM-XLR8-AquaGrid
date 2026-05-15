import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet.heat';
import { WARDS_DATA, RISK_COLORS, BENGALURU_CENTER, DEFAULT_ZOOM, HEATMAP_OPTIONS, findNearestWard } from '../data/wards';
import { generateForecastData } from '../data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';

// Heatmap layer component using leaflet.heat
function HeatmapLayer({ wards }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !wards || wards.length === 0) return;

    // Create heat data points: [lat, lng, intensity]
    const heatData = wards.map(w => [
      w.lat,
      w.lng,
      w.risk_score / 100, // intensity 0–1
    ]);

    const heat = L.heatLayer(heatData, HEATMAP_OPTIONS);
    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, wards]);

  return null;
}

// Click handler to find nearest ward
function MapClickHandler({ onWardClick }) {
  const map = useMap();

  useEffect(() => {
    const handler = (e) => {
      const nearest = findNearestWard(e.latlng.lat, e.latlng.lng);
      if (nearest) onWardClick(nearest);
    };
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onWardClick]);

  return null;
}

// Ward info drawer
function WardDrawer({ ward, onClose }) {
  if (!ward) return null;
  const data = generateForecastData(ward);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30 }}
      className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 bg-slate-900/95 backdrop-blur-xl border-l border-blue-800/40 shadow-2xl overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{ward.ward_name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className={`p-4 rounded-xl mb-6 ${
          ward.risk_level === 'critical' ? 'bg-rose-500/10 border border-rose-500/30' :
          ward.risk_level === 'orange' ? 'bg-amber-500/10 border border-amber-500/30' :
          ward.risk_level === 'blue' ? 'bg-blue-500/10 border border-blue-500/30' :
          'bg-emerald-500/10 border border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Current Risk Score</span>
            <span className={`text-2xl font-bold ${RISK_COLORS[ward.risk_level]?.text}`}>{ward.risk_score}</span>
          </div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${ward.risk_score}%`, backgroundColor: RISK_COLORS[ward.risk_level]?.fill }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Ward {ward.ward_number} • {ward.zone} Zone</p>
        </div>

        <h4 className="text-sm font-semibold text-slate-400 mb-3">7-Day Risk Forecast</h4>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="riskGradDrawer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
              <RTooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="riskScore" stroke="#3B82F6" fill="url(#riskGradDrawer)" strokeWidth={2} name="Risk Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 mt-4">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 glass-card text-sm">
              <span className="text-slate-400">{d.date}</span>
              <div className="flex items-center gap-3">
                <span className="text-blue-300">🌧 {d.rainfall}mm</span>
                <span className={`font-semibold ${
                  d.riskScore > 75 ? 'text-rose-400' :
                  d.riskScore > 50 ? 'text-amber-400' :
                  d.riskScore > 25 ? 'text-blue-400' : 'text-emerald-400'
                }`}>{d.riskScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function MapPage() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? WARDS_DATA : WARDS_DATA.filter(w => w.risk_level === filter);

  return (
    <div className="page-wrapper">
      <section className="section-container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Live Water Risk Heatmap</h1>
              <p className="text-slate-400 text-sm">Real-time ward-level risk assessment for Bengaluru</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'green', 'blue', 'orange', 'critical'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border capitalize
                    ${filter === f ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-600/30'}`}>
                  {f === 'all' ? 'All Wards' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card overflow-hidden relative" style={{ height: '550px' }}>
              <MapContainer center={BENGALURU_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                <HeatmapLayer wards={filtered} />
                <MapClickHandler onWardClick={setSelected} />
              </MapContainer>

              {/* Legend card — bottom right */}
              <div className="absolute bottom-4 right-4 z-[1000] glass-card p-3 flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Risk Level</span>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3B82F6' }} /><span className="text-xs text-slate-300">🔵 Stable</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} /><span className="text-xs text-slate-300">🟡 Moderate</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F97316' }} /><span className="text-xs text-slate-300">🟠 High</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} /><span className="text-xs text-slate-300">🔴 Critical</span></div>
              </div>
            </div>

            {/* Side panel — Ward List */}
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Ward List ({filtered.length})</h3>
              {filtered.sort((a, b) => b.risk_score - a.risk_score).map(w => (
                <button key={w.id} onClick={() => setSelected(w)}
                  className={`w-full text-left glass-card p-4 transition-all hover:border-blue-500/40 ${selected?.id === w.id ? 'border-blue-500/60 bg-blue-500/5' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white text-sm">{w.ward_name}</span>
                    <span className={`badge ${w.risk_level === 'critical' ? 'badge-rose' : w.risk_level === 'orange' ? 'badge-amber' : w.risk_level === 'blue' ? 'badge-blue' : 'badge-green'}`}>
                      {w.risk_score}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${w.risk_score}%`, backgroundColor: RISK_COLORS[w.risk_level]?.fill }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{w.zone} zone • Ward {w.ward_number}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Ward info drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)} />
            <WardDrawer ward={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
