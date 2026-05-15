import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useAuth } from '../context/AuthContext';
import ReportWaterIssue from '../components/ReportWaterIssue';
import { WARDS_DATA, RISK_COLORS, BENGALURU_CENTER, DEFAULT_ZOOM, HEATMAP_OPTIONS, findNearestWard, isInBengaluru } from '../data/wards';
import { MOCK_FEEDBACK, generateForecastData } from '../data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';

// Heatmap layer for landing page mini-map
function LandingHeatmapLayer({ wards }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !wards || wards.length === 0) return;
    const heatData = wards.map(w => [w.lat, w.lng, w.risk_score / 100]);
    const heat = L.heatLayer(heatData, HEATMAP_OPTIONS);
    heat.addTo(map);
    return () => map.removeLayer(heat);
  }, [map, wards]);
  return null;
}

// Click handler to find nearest ward on the map
function LandingMapClickHandler({ onWardClick }) {
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

// Ward name labels — visible at zoom 12+
function WardLabels({ wards }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !wards || wards.length === 0) return;
    const markers = wards.map(w => {
      const icon = L.divIcon({
        html: `<span style="font-size:11px;font-weight:600;color:#ffffff;text-shadow:0 1px 3px rgba(0,0,0,0.8);white-space:nowrap;pointer-events:none;">${w.ward_name}</span>`,
        className: '',
        iconAnchor: [0, 0],
      });
      return L.marker([w.lat, w.lng], { icon, interactive: false, zIndexOffset: 1000 });
    });
    const labelGroup = L.layerGroup(markers);
    const toggle = () => {
      if (map.getZoom() >= 12) { if (!map.hasLayer(labelGroup)) labelGroup.addTo(map); }
      else { if (map.hasLayer(labelGroup)) map.removeLayer(labelGroup); }
    };
    toggle();
    map.on('zoomend', toggle);
    return () => { map.off('zoomend', toggle); if (map.hasLayer(labelGroup)) map.removeLayer(labelGroup); };
  }, [map, wards]);
  return null;
}

// Water ripple background component
function WaterRipples() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/20"
            style={{
              animation: `rippleExpand ${4 + i * 0.5}s ease-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>
      {/* Gradient orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-float" />
    </div>
  );
}

// Location toast
function LocationToast({ ward, onClose }) {
  if (!ward) return null;

  const riskConfig = {
    green: { icon: '✅', msg: `You're in ${ward.ward_name} — No scarcity expected in the next 7 days`, showBook: false },
    blue: { icon: '🔵', msg: `You're in ${ward.ward_name} — Mild scarcity possible in 3–4 days.`, showBook: true, bookText: 'Order water here →' },
    orange: { icon: '⚠️', msg: `You're in ${ward.ward_name} — Water shortage likely within 48 hours.`, showBook: true, bookText: 'Book now →' },
    critical: { icon: '🚨', msg: `You're in ${ward.ward_name} — Critical shortage. Many residents have already booked.`, showBook: true, bookText: 'Book Now →' },
  };

  const config = riskConfig[ward.risk_level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full mx-4"
    >
      <div className="toast-glass flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{config.icon}</span>
        <div className="flex-1">
          <p className="text-sm text-blue-100">{config.msg}</p>
          {config.showBook && (
            <Link to="/book-water" className="inline-block mt-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              🚰 {config.bookText}
            </Link>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">✕</button>
      </div>
    </motion.div>
  );
}

// Map fly-to component
function FlyToLocation({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 13, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

// Forecast drawer
function ForecastDrawer({ ward, onClose }) {
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
        </div>

        <h4 className="text-sm font-semibold text-slate-400 mb-3">7-Day Risk Forecast</h4>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
              <RTooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '12px' }}
              />
              <Area type="monotone" dataKey="riskScore" stroke="#3B82F6" fill="url(#riskGrad)" strokeWidth={2} name="Risk Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
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

        <Link to="/book-water" className="btn-primary w-full text-center block mt-6">
          🚰 Book Water for {ward.ward_name}
        </Link>
      </div>
    </motion.div>
  );
}

// Star display
function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={`text-sm ${s <= rating ? 'text-amber-400' : 'text-slate-600'}`}>★</span>
      ))}
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [detectedWard, setDetectedWard] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [selectedWard, setSelectedWard] = useState(null);
  const [showPermission, setShowPermission] = useState(true);
  const [feedbackIndex, setFeedbackIndex] = useState(0);

  // Auto-scroll feedback carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setFeedbackIndex(prev => (prev + 1) % (MOCK_FEEDBACK.length - 2));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const requestLocation = useCallback(() => {
    setShowPermission(false);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (isInBengaluru(latitude, longitude)) {
            setUserLocation({ lat: latitude, lng: longitude });
            const nearest = findNearestWard(latitude, longitude);
            setDetectedWard(nearest);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 8000);
          }
        },
        () => { /* denied or error */ }
      );
    }
  }, []);

  const dismissPermission = () => setShowPermission(false);

  return (
    <div className="page-wrapper">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <WaterRipples />
        <div className="relative z-10 section-container text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Know About Water Scarcity<br />
              <span className="text-gradient">Before Anyone Else</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              Real-time hyper-local water intelligence for Bengaluru
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a
                href="tel:1916"
                className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                📞 Call Helpline: 1916
              </a>
              <Link
                to={isAuthenticated ? '/book-water' : '/register'}
                className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                🚰 Book Water Now
              </Link>
            </div>

            <p className="text-sm text-slate-500">
              Or scroll down to see your area's live water status
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== LOCATION PERMISSION BANNER ===== */}
      {showPermission && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-container mb-8"
        >
          <div className="glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <p className="text-sm text-slate-300">
                Allow AquaGrid to detect your location for personalised water alerts for your ward
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={requestLocation} className="btn-primary text-sm !px-5 !py-2">Allow</button>
              <button onClick={dismissPermission} className="btn-secondary text-sm !px-5 !py-2">Not Now</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Location toast */}
      {showToast && <LocationToast ward={detectedWard} onClose={() => setShowToast(false)} />}

      {/* ===== MINI WARD MAP ===== */}
      <section className="section-container mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">Live Ward Risk Heatmap</h2>
          <p className="text-slate-400 mb-6">Click anywhere on the map to see the nearest ward's forecast</p>
          <div className="glass-card overflow-hidden relative" style={{ height: '450px' }}>
            <MapContainer
              center={BENGALURU_CENTER}
              zoom={DEFAULT_ZOOM}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {userLocation && <FlyToLocation lat={userLocation.lat} lng={userLocation.lng} />}
              <LandingHeatmapLayer wards={WARDS_DATA} />
              <WardLabels wards={WARDS_DATA} />
              <LandingMapClickHandler onWardClick={setSelectedWard} />
              {/* User location pin */}
              {userLocation && (
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={8}
                  pathOptions={{
                    color: '#06B6D4',
                    fillColor: '#06B6D4',
                    fillOpacity: 0.9,
                    weight: 3,
                    className: 'glow-cyan',
                  }}
                >
                  <Tooltip permanent>
                    <span className="font-semibold">📍 You are here</span>
                  </Tooltip>
                </CircleMarker>
              )}
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
        </motion.div>
      </section>

      {/* Forecast drawer */}
      {selectedWard && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedWard(null)} />
          <ForecastDrawer ward={selectedWard} onClose={() => setSelectedWard(null)} />
        </>
      )}

      {/* ===== FEATURES SECTION ===== */}
      <section className="section-container mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
            Be the First to Know When Your Ward is Affected
          </h2>
          <p className="text-slate-400 text-center mb-10">Know before everyone else</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🛰️',
                title: 'Multi-source Intelligence',
                desc: 'We track reservoir levels, rainfall, BWSSB schedules and news, not just user reports',
              },
              {
                icon: '📧',
                title: 'Early Email Alerts',
                desc: 'Get warned 3–5 days before scarcity hits your ward',
              },
              {
                icon: '📊',
                title: '7-Day Forecast',
                desc: 'See predicted risk levels for your exact ward',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card-hover p-6 text-center group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/register" className="btn-primary inline-flex items-center gap-2">
              Register for Free Alerts
            </Link>
          </div>
        </motion.div>
      </section>

      <ReportWaterIssue />

      {/* ===== PUBLIC FEEDBACK STRIP ===== */}
      <section className="section-container mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">What Residents Say</h2>
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-4"
              animate={{ x: `-${feedbackIndex * 320}px` }}
              transition={{ type: 'spring', stiffness: 100, damping: 30 }}
            >
              {MOCK_FEEDBACK.map((fb, i) => (
                <div
                  key={fb.id}
                  className="glass-card p-5 min-w-[300px] border-cyan-500/20 flex-shrink-0"
                >
                  <Stars rating={fb.rating} />
                  <p className="text-sm text-slate-300 mt-3 mb-3 line-clamp-3">"{fb.comment}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-400 font-medium">{fb.user_name}</span>
                    <span className="text-xs text-slate-600">{fb.ward_name}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
