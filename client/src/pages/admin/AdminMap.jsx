import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import { WARDS_DATA, RISK_COLORS, RISK_OPACITY, BENGALURU_CENTER } from '../../data/wards';
import { useToast } from '../../context/ToastContext';

export default function AdminMap() {
  const toast = useToast();
  const [wards, setWards] = useState(WARDS_DATA);
  const [editingWard, setEditingWard] = useState(null);
  const [editScore, setEditScore] = useState('');

  const saveRiskScore = (wardId) => {
    const score = parseInt(editScore);
    if (isNaN(score) || score < 0 || score > 100) return toast.error('Score must be 0–100');
    const level = score <= 25 ? 'green' : score <= 50 ? 'blue' : score <= 75 ? 'orange' : 'critical';
    setWards(prev => prev.map(w => w.id === wardId ? { ...w, risk_score: score, risk_level: level } : w));
    setEditingWard(null);
    toast.success('Risk score updated');
  };

  return (
    <div className="page-wrapper section-container py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Risk Map</h1>
          <p className="text-slate-400 text-sm">Click any ward to edit risk score</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card overflow-hidden" style={{ height: '550px' }}>
            <MapContainer center={BENGALURU_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
              {wards.map(w => (
                <CircleMarker key={w.id} center={[w.lat, w.lng]}
                  radius={w.risk_score > 75 ? 18 : w.risk_score > 50 ? 15 : 12}
                  pathOptions={{ color: RISK_COLORS[w.risk_level]?.border, fillColor: RISK_COLORS[w.risk_level]?.fill, fillOpacity: RISK_OPACITY[w.risk_level], weight: 2 }}
                  eventHandlers={{ click: () => { setEditingWard(w); setEditScore(String(w.risk_score)); } }}>
                  <Tooltip><div className="text-center"><div className="font-semibold">{w.ward_name}</div><div className="text-xs">Risk: {w.risk_score}</div></div></Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* Edit panel */}
          <div>
            {editingWard ? (
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-lg font-bold text-white">{editingWard.ward_name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Current Score</span>
                  <span className={`text-2xl font-bold ${RISK_COLORS[editingWard.risk_level]?.text}`}>{editingWard.risk_score}</span>
                </div>
                <div>
                  <label className="input-label">New Risk Score (0–100)</label>
                  <input type="number" min={0} max={100} className="input-field" value={editScore} onChange={e => setEditScore(e.target.value)} />
                  <input type="range" min={0} max={100} className="w-full mt-2" value={editScore} onChange={e => setEditScore(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => saveRiskScore(editingWard.id)} className="btn-primary flex-1 text-sm">Save</button>
                  <button onClick={() => setEditingWard(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
                </div>
                <button onClick={() => toast.info('Alert emails would be sent to all users in ' + editingWard.ward_name)}
                  className="w-full btn-secondary text-sm !border-amber-500/40 !text-amber-400">
                  📧 Send Alert to Ward Users
                </button>
              </div>
            ) : (
              <div className="glass-card p-5 text-center">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="text-slate-400 text-sm">Click a ward on the map to edit its risk score</p>
              </div>
            )}

            {/* Ward summary */}
            <div className="mt-4 space-y-2 max-h-[350px] overflow-y-auto">
              {wards.sort((a, b) => b.risk_score - a.risk_score).map(w => (
                <button key={w.id} onClick={() => { setEditingWard(w); setEditScore(String(w.risk_score)); }}
                  className={`w-full text-left glass-card p-3 text-sm transition-all hover:border-blue-500/40 ${editingWard?.id === w.id ? 'border-blue-500/60' : ''}`}>
                  <div className="flex justify-between">
                    <span className="text-white">{w.ward_name}</span>
                    <span className={RISK_COLORS[w.risk_level]?.text + ' font-bold'}>{w.risk_score}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
