// AquaGrid — Bengaluru Ward Data (client-side seed/fallback)
// 20 real wards with realistic coordinates and risk scores
// Matches the Supabase seed data

export const WARDS_DATA = [
  { id: 1,  ward_name: 'Koramangala',      ward_number: 68,  zone: 'South',    lat: 12.9352, lng: 77.6245, risk_score: 45, risk_level: 'blue' },
  { id: 2,  ward_name: 'Whitefield',       ward_number: 84,  zone: 'East',     lat: 12.9698, lng: 77.7500, risk_score: 78, risk_level: 'critical' },
  { id: 3,  ward_name: 'Indiranagar',      ward_number: 75,  zone: 'East',     lat: 12.9784, lng: 77.6408, risk_score: 35, risk_level: 'green' },
  { id: 4,  ward_name: 'Hebbal',           ward_number: 6,   zone: 'North',    lat: 13.0353, lng: 77.5970, risk_score: 60, risk_level: 'orange' },
  { id: 5,  ward_name: 'Electronic City',  ward_number: 150, zone: 'South',    lat: 12.8399, lng: 77.6770, risk_score: 80, risk_level: 'critical' },
  { id: 6,  ward_name: 'Jayanagar',        ward_number: 56,  zone: 'South',    lat: 12.9308, lng: 77.5831, risk_score: 28, risk_level: 'green' },
  { id: 7,  ward_name: 'Marathahalli',     ward_number: 82,  zone: 'East',     lat: 12.9591, lng: 77.6974, risk_score: 68, risk_level: 'orange' },
  { id: 8,  ward_name: 'Yelahanka',        ward_number: 3,   zone: 'North',    lat: 13.1005, lng: 77.5963, risk_score: 63, risk_level: 'orange' },
  { id: 9,  ward_name: 'BTM Layout',       ward_number: 67,  zone: 'South',    lat: 12.9166, lng: 77.6101, risk_score: 50, risk_level: 'blue' },
  { id: 10, ward_name: 'Malleswaram',      ward_number: 28,  zone: 'West',     lat: 13.0032, lng: 77.5655, risk_score: 25, risk_level: 'green' },
  { id: 11, ward_name: 'HSR Layout',       ward_number: 72,  zone: 'South',    lat: 12.9116, lng: 77.6389, risk_score: 55, risk_level: 'blue' },
  { id: 12, ward_name: 'Rajajinagar',      ward_number: 30,  zone: 'West',     lat: 12.9923, lng: 77.5518, risk_score: 38, risk_level: 'green' },
  { id: 13, ward_name: 'Banashankari',     ward_number: 55,  zone: 'South',    lat: 12.9256, lng: 77.5462, risk_score: 48, risk_level: 'blue' },
  { id: 14, ward_name: 'Bellandur',        ward_number: 85,  zone: 'East',     lat: 12.9259, lng: 77.6762, risk_score: 72, risk_level: 'orange' },
  { id: 15, ward_name: 'Vijayanagar',      ward_number: 32,  zone: 'West',     lat: 12.9719, lng: 77.5161, risk_score: 36, risk_level: 'green' },
  { id: 16, ward_name: 'Sarjapur Road',    ward_number: 87,  zone: 'East',     lat: 12.9010, lng: 77.6920, risk_score: 75, risk_level: 'critical' },
  { id: 17, ward_name: 'Kanakapura Road',  ward_number: 153, zone: 'South',    lat: 12.8730, lng: 77.5920, risk_score: 65, risk_level: 'orange' },
  { id: 18, ward_name: 'Ulsoor',           ward_number: 74,  zone: 'Central',  lat: 12.9830, lng: 77.6210, risk_score: 30, risk_level: 'green' },
  { id: 19, ward_name: 'Basavanagudi',     ward_number: 52,  zone: 'South',    lat: 12.9422, lng: 77.5747, risk_score: 27, risk_level: 'green' },
  { id: 20, ward_name: 'Hosur Road',       ward_number: 151, zone: 'South',    lat: 12.8960, lng: 77.6410, risk_score: 70, risk_level: 'orange' },
];

// Risk level color mapping
export const RISK_COLORS = {
  green:    { fill: '#10B981', border: '#059669', bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Safe' },
  blue:     { fill: '#3B82F6', border: '#2563EB', bg: 'bg-blue-500',    text: 'text-blue-400',    label: 'Mild Risk' },
  orange:   { fill: '#F59E0B', border: '#D97706', bg: 'bg-amber-500',   text: 'text-amber-400',   label: 'High Risk' },
  critical: { fill: '#EF4444', border: '#DC2626', bg: 'bg-rose-500',    text: 'text-rose-400',    label: 'Critical' },
};

// Fill opacity by risk level
export const RISK_OPACITY = {
  green: 0.5,
  blue: 0.5,
  orange: 0.6,
  critical: 0.7,
};

// Bengaluru bounding box
export const BENGALURU_BOUNDS = {
  latMin: 12.834,
  latMax: 13.139,
  lngMin: 77.460,
  lngMax: 77.780,
};

// Map center
export const BENGALURU_CENTER = [12.9716, 77.5946];
export const DEFAULT_ZOOM = 11;

// Find nearest ward to coordinates
export function findNearestWard(lat, lng, wards = WARDS_DATA) {
  let nearest = null;
  let minDist = Infinity;
  for (const ward of wards) {
    const dist = Math.sqrt(Math.pow(ward.lat - lat, 2) + Math.pow(ward.lng - lng, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = ward;
    }
  }
  return nearest;
}

// Check if coordinates are within Bengaluru
export function isInBengaluru(lat, lng) {
  return (
    lat >= BENGALURU_BOUNDS.latMin &&
    lat <= BENGALURU_BOUNDS.latMax &&
    lng >= BENGALURU_BOUNDS.lngMin &&
    lng <= BENGALURU_BOUNDS.lngMax
  );
}

// Get risk level from score
export function getRiskLevel(score) {
  if (score <= 25) return 'green';
  if (score <= 50) return 'blue';
  if (score <= 75) return 'orange';
  return 'critical';
}

// Quantity price mapping
export const QUANTITY_OPTIONS = [
  { value: '500L',  label: '500 Litres',  price: 350,  icon: '🪣' },
  { value: '1000L', label: '1000 Litres', price: 650,  icon: '🚿' },
  { value: '2000L', label: '2000 Litres', price: 1200, icon: '🚰' },
];

// Delivery time slots
export const TIME_SLOTS = [
  { value: 'morning',   label: 'Morning',   time: '6:00 AM – 10:00 AM', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon',  time: '12:00 PM – 4:00 PM', icon: '☀️' },
  { value: 'evening',   label: 'Evening',    time: '5:00 PM – 8:00 PM',  icon: '🌆' },
];

// Status progression
export const STATUS_STEPS = ['pending', 'confirmed', 'out_for_delivery', 'delivered'];

export const STATUS_CONFIG = {
  pending:          { label: 'Pending',          color: 'bg-amber-500',   textColor: 'text-amber-400',  icon: '⏳' },
  confirmed:        { label: 'Confirmed',        color: 'bg-blue-500',    textColor: 'text-blue-400',   icon: '✅' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-cyan-500',    textColor: 'text-cyan-400',   icon: '🚛', pulse: true },
  delivered:        { label: 'Delivered',         color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: '📦' },
  cancelled:        { label: 'Cancelled',         color: 'bg-rose-500',    textColor: 'text-rose-400',   icon: '❌' },
};

// Heatmap gradient configuration
export const HEATMAP_GRADIENT = {
  0.0: '#3B82F6',   // blue — stable
  0.3: '#10B981',   // green — low risk
  0.5: '#F59E0B',   // amber — moderate
  0.7: '#F97316',   // orange — high
  1.0: '#EF4444',   // red — critical
};

export const HEATMAP_OPTIONS = {
  radius: 45,
  blur: 35,
  maxZoom: 13,
  gradient: HEATMAP_GRADIENT,
};
