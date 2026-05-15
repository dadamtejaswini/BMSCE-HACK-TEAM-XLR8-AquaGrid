# AquaGrid 💧
> Know About Water Scarcity Before Anyone Else

**Tagline:** Real-time ward-level water scarcity prediction and private water tanker booking for Bengaluru.

---

## 🚨 Problem Statement
Bengaluru faces a severe water crisis:
- 650 MLD daily water deficit
- 46,427 properties without piped connections
- No real-time early warning system for residents
- No easy way to book private water tankers

AquaGrid solves this with AI-powered scarcity prediction + an Uber-like water booking platform.

---

## 👥 Team Members — Team XLR8

| Name | USN |
|------|-----|
| [Member 1 Name] | [USN] |
| [Member 2 Name] | [USN] |
| [Member 3 Name] | [USN] |
| [Member 4 Name] | [USN] |

Institution: BMS College of Engineering (BMSCE), Bengaluru

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS (dark/light theme)
- Leaflet.js + leaflet.heat (heatmap)
- Recharts (data visualization)
- react-i18next (EN / HI / KN)
- Framer Motion (animations)

### Backend
- Node.js + Express.js
- Supabase (PostgreSQL + Auth + Realtime)
- Resend API (transactional emails)

### Data & APIs
- OpenWeatherMap API (live rainfall)
- BWSSB/KGIS KML (30 real pump stations)
- Bengaluru Building Dataset (1,250 buildings)
- Seasonal reservoir model

---

## ✅ Features Implemented

- 🗺️ Real-time ward-level water risk heatmap (20 Bengaluru wards)
- 🤖 AI risk score engine (reservoir + rainfall + usage data)
- 🚰 Private water tanker booking platform
- 📧 Early email alerts when scarcity detected
- 📦 Order tracking with real-time status updates
- ⭐ Feedback system (post-delivery only)
- 🛡️ Admin panel (orders, map, users, queries)
- 🌐 Multi-language support (English, Hindi, Kannada)
- 🌙 Dark / Light theme toggle
- 📍 Location-based ward detection
- 💧 30 real BWSSB pump station markers
- 📊 7-day risk forecast per ward
- 📱 Animated logo intro

---

## 📁 Project Structure

AquaGrid/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Navbar, Footer, Modals
│   │   ├── context/         # Auth, Toast, Theme
│   │   ├── data/            # Ward data, mock data
│   │   ├── i18n/            # EN / HI / KN locales
│   │   ├── pages/           # All app pages + admin
│   │   └── lib/             # Supabase client
│   ├── .env.example
│   └── tailwind.config.js
├── server/                  # Node.js + Express backend
│   ├── routes/              # bookings, auth, admin, etc.
│   ├── services/           # Email service (Resend)
│   └── .env.example
├── supabase/
│   └── migrations/          # SQL schema files
├── screenshots/             # App screenshots
├── presentation/            # Final PPT/PDF
└── README.md

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+
- npm v9+
- Supabase account (free tier works)
- Resend account (free tier works)
- OpenWeatherMap API key (free)

### 1. Clone the repository
```bash
# Add your clone URL
```

### 2. Setup Client
```bash
cd client
npm install --legacy-peer-deps
cp .env.example .env
npm run dev
```

### 3. Setup Server
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 4. Setup Supabase
1. Open Supabase SQL editor
2. Run:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/seed.sql`
3. Ensure RLS policies are enabled

---

## 🧪 Demo Mode
The app can run in demo mode without external Supabase setup.
- Use the **Demo Login** option on the navbar/login page
- App will render with mock data.

---

## 🔒 Security Notes
- Never commit real Supabase service role keys to GitHub.
- Use environment variables (`.env`) for secrets.

---

## 📝 License
Private project for BMSCE Hackathon.

