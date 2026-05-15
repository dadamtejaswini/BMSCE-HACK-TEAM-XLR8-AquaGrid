// AquaGrid — Mock Data for demo/development mode
// Provides realistic data when Supabase is not connected

import { WARDS_DATA } from './wards';

// Generate a random booking ID
export function generateBookingId() {
  const year = new Date().getFullYear();
  const num = String(Math.floor(10000 + Math.random() * 90000));
  return `AQ-${year}-${num}`;
}

// Mock bookings
export const MOCK_BOOKINGS = [
  {
    id: 'b1',
    user_id: 'demo-user',
    ward_name: 'Koramangala',
    address: '123, 1st Cross, Koramangala 4th Block, Bengaluru - 560034',
    quantity: '1000L',
    delivery_date: '2026-05-16',
    delivery_slot: 'morning',
    payment_method: 'online',
    status: 'delivered',
    booking_id: 'AQ-2026-00123',
    created_at: '2026-05-12T10:30:00Z',
  },
  {
    id: 'b2',
    user_id: 'demo-user',
    ward_name: 'Koramangala',
    address: '123, 1st Cross, Koramangala 4th Block, Bengaluru - 560034',
    quantity: '2000L',
    delivery_date: '2026-05-18',
    delivery_slot: 'afternoon',
    payment_method: 'cash',
    status: 'out_for_delivery',
    booking_id: 'AQ-2026-00456',
    created_at: '2026-05-14T09:15:00Z',
  },
  {
    id: 'b3',
    user_id: 'demo-user',
    ward_name: 'Koramangala',
    address: '123, 1st Cross, Koramangala 4th Block, Bengaluru - 560034',
    quantity: '500L',
    delivery_date: '2026-05-20',
    delivery_slot: 'evening',
    payment_method: 'online',
    status: 'confirmed',
    booking_id: 'AQ-2026-00789',
    created_at: '2026-05-15T14:00:00Z',
  },
  {
    id: 'b4',
    user_id: 'demo-user',
    ward_name: 'Koramangala',
    address: '123, 1st Cross, Koramangala 4th Block, Bengaluru - 560034',
    quantity: '1000L',
    delivery_date: '2026-05-22',
    delivery_slot: 'morning',
    payment_method: 'cash',
    status: 'pending',
    booking_id: 'AQ-2026-01012',
    created_at: '2026-05-15T16:30:00Z',
  },
];

// Mock feedback entries
export const MOCK_FEEDBACK = [
  { id: 'f1', user_name: 'Priya S.', rating: 5, comment: 'Delivery was on time and the driver was very helpful. Will definitely use again!', ward_name: 'Koramangala', created_at: '2026-05-10T12:00:00Z', display_public: true },
  { id: 'f2', user_name: 'Rahul M.', rating: 4, comment: 'Good service, water quality was excellent. Slightly delayed by 30 mins but acceptable.', ward_name: 'Whitefield', created_at: '2026-05-11T14:00:00Z', display_public: true },
  { id: 'f3', user_name: 'Kavitha R.', rating: 5, comment: 'Lifesaver during the water crisis! Booked at 8 PM, delivered by 7 AM next day.', ward_name: 'Electronic City', created_at: '2026-05-12T09:00:00Z', display_public: true },
  { id: 'f4', user_name: 'Arun K.', rating: 4, comment: 'Very convenient booking process. The app made it super easy to get water during shortage.', ward_name: 'HSR Layout', created_at: '2026-05-12T16:00:00Z', display_public: true },
  { id: 'f5', user_name: 'Deepa N.', rating: 5, comment: 'The early warning alert saved us! We booked water 3 days before the shortage hit our area.', ward_name: 'Marathahalli', created_at: '2026-05-13T10:00:00Z', display_public: true },
  { id: 'f6', user_name: 'Suresh B.', rating: 3, comment: 'Service was okay. Delivery came in the right slot. Would appreciate SMS updates too.', ward_name: 'BTM Layout', created_at: '2026-05-13T18:00:00Z', display_public: true },
  { id: 'f7', user_name: 'Meena P.', rating: 5, comment: 'Best water delivery service in Bengaluru. The risk alerts are incredibly accurate!', ward_name: 'Yelahanka', created_at: '2026-05-14T08:00:00Z', display_public: true },
  { id: 'f8', user_name: 'Vikram J.', rating: 4, comment: 'Registered after neighbor recommended. The forecast feature is amazing — predicted shortage perfectly.', ward_name: 'Bellandur', created_at: '2026-05-14T15:00:00Z', display_public: true },
];

// Mock risk forecast data (7-day)
export function generateForecastData(ward) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const baseScore = ward.risk_score;
  return days.map((day, i) => ({
    day,
    date: new Date(Date.now() + i * 86400000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    riskScore: Math.max(0, Math.min(100, baseScore + Math.floor((Math.random() - 0.4) * 20))),
    rainfall: Math.max(0, Math.floor(Math.random() * 15)),
    reservoirLevel: Math.max(20, Math.min(95, 60 + Math.floor((Math.random() - 0.5) * 40))),
    reports: Math.floor(Math.random() * 12),
  }));
}

// Mock admin stats
export const MOCK_ADMIN_STATS = {
  totalBookingsToday: 47,
  pendingOrders: 12,
  outForDelivery: 8,
  deliveredToday: 27,
  activeUsers: 1243,
  reportsToday: 34,
  avgRiskScore: 52,
};

// Mock all bookings for admin
export const MOCK_ALL_BOOKINGS = [
  ...MOCK_BOOKINGS,
  { id: 'b5', user_id: 'user-2', user_name: 'Rahul M.', ward_name: 'Whitefield', address: '45, Main Road, Whitefield', quantity: '2000L', delivery_date: '2026-05-17', delivery_slot: 'morning', payment_method: 'online', status: 'pending', booking_id: 'AQ-2026-01100', created_at: '2026-05-15T08:00:00Z' },
  { id: 'b6', user_id: 'user-3', user_name: 'Kavitha R.', ward_name: 'Electronic City', address: '78, Phase 1, Electronic City', quantity: '1000L', delivery_date: '2026-05-16', delivery_slot: 'afternoon', payment_method: 'cash', status: 'confirmed', booking_id: 'AQ-2026-01234', created_at: '2026-05-14T22:00:00Z' },
  { id: 'b7', user_id: 'user-4', user_name: 'Arun K.', ward_name: 'HSR Layout', address: '12, Sector 2, HSR Layout', quantity: '500L', delivery_date: '2026-05-16', delivery_slot: 'evening', payment_method: 'online', status: 'out_for_delivery', booking_id: 'AQ-2026-01567', created_at: '2026-05-15T06:00:00Z' },
  { id: 'b8', user_id: 'user-5', user_name: 'Deepa N.', ward_name: 'Marathahalli', address: '34, 2nd Main, Marathahalli', quantity: '1000L', delivery_date: '2026-05-15', delivery_slot: 'morning', payment_method: 'cash', status: 'delivered', booking_id: 'AQ-2026-01890', created_at: '2026-05-13T11:00:00Z' },
];

// Mock users for admin
export const MOCK_USERS = [
  { id: 'demo-user', name: 'Demo User', email: 'demo@aquagrid.in', phone: '+919876543210', ward_name: 'Koramangala', ward_number: 150, role: 'admin', created_at: '2026-05-01T10:00:00Z' },
  { id: 'user-2', name: 'Rahul Mehta', email: 'rahul@gmail.com', phone: '+919876543211', ward_name: 'Whitefield', ward_number: 85, role: 'user', created_at: '2026-05-05T12:00:00Z' },
  { id: 'user-3', name: 'Kavitha Reddy', email: 'kavitha@gmail.com', phone: '+919876543212', ward_name: 'Electronic City', ward_number: 192, role: 'user', created_at: '2026-05-08T09:00:00Z' },
  { id: 'user-4', name: 'Arun Kumar', email: 'arun@gmail.com', phone: '+919876543213', ward_name: 'HSR Layout', ward_number: 174, role: 'user', created_at: '2026-05-10T14:00:00Z' },
  { id: 'user-5', name: 'Deepa Nair', email: 'deepa@gmail.com', phone: '+919876543214', ward_name: 'Marathahalli', ward_number: 84, role: 'user', created_at: '2026-05-12T16:00:00Z' },
];
