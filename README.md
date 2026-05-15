# 💧 AquaGrid — Smart Water Intelligence for Bengaluru

A full-stack water scarcity prediction and private water booking platform for Bengaluru. Real-time ward-level risk maps, 7-day forecasts, and guaranteed water delivery.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) + Tailwind CSS v3 |
| Backend | Node.js + Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Maps | Leaflet.js + OpenStreetMap (CartoDB dark tiles) |
| Charts | Recharts |
| Email | Resend API |
| APIs | OpenWeatherMap, NewsAPI |

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Frontend (Client)
```bash
cd client
npm install --legacy-peer-deps
npm run dev
```
Runs on `http://localhost:5173`

### 2. Backend (Server)
```bash
cd server
npm install
npm run dev
```
Runs on `http://localhost:3001`

### 3. Database Setup
Run the SQL files in your Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql` — Creates all tables and policies
2. `supabase/seed.sql` — Seeds 20 Bengaluru wards with risk data

## Demo Mode

The app runs in **full demo mode** without any Supabase setup:
- Click **"Demo Login"** on the navbar or login page
- This logs you in as an admin user with mock data
- All pages render with realistic mock data
- No external API calls required

## Environment Variables

### Client (`client/.env`)
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=your-razorpay-key (optional)
```

### Server (`server/.env`)
```
PORT=3001
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENWEATHERMAP_API_KEY=your-key
NEWS_API_KEY=your-key
RESEND_API_KEY=your-key
RAZORPAY_KEY_SECRET=your-key (optional)
```

## Pages

| Route | Description | Protected |
|-------|-------------|-----------|
| `/` | Landing page with hero, ward map, features | No |
| `/map` | Full interactive ward risk map | No |
| `/forecast` | 7-day water forecast with charts | No |
| `/compare` | BBMP vs AquaGrid comparison | No |
| `/register` | Multi-step registration form | No |
| `/login` | Login page | No |
| `/book-water` | Water delivery booking form | Yes |
| `/request-water` | Report water issues | Yes |
| `/my-orders` | Order history with live status | Yes |
| `/feedback/:id` | Post-delivery feedback | Yes |
| `/admin` | Admin dashboard | Admin |
| `/admin/orders` | Order management table | Admin |
| `/admin/map` | Admin risk map editor | Admin |
| `/admin/users` | User management | Admin |

## Database Schema

7 tables: `users`, `wards`, `user_reports`, `water_bookings`, `feedback`, `risk_data_log`, `survey_responses`

See `supabase/migrations/001_initial_schema.sql` for full schema with RLS policies.

## Risk Score Engine

Risk calculation per ward (0–100):
- **Reservoir Score**: Inverted level (low = high risk) — up to 40 points
- **Rainfall Score**: No rain in 7 days → +20 points
- **Report Score**: User reports × 5, capped at 30
- **News Score**: News mentions × 3, capped at 15
- **Seasonal Score**: March–June +15, Monsoon −10

Risk levels: Green (0–25) → Blue (26–50) → Orange (51–75) → Critical (76–100)

## Color Scheme

- Primary: Blue (#1E40AF → #2563EB → #3B82F6)
- Secondary: Slate (#0F172A, #1E293B)
- Accent: Cyan (#06B6D4)
- Warning: Amber (#F59E0B)
- Critical: Rose (#F43F5E)
- Success: Emerald (#10B981)
- **No white backgrounds** — slate-900/slate-800 base throughout

## License

Private project for MCA Hackathon.
