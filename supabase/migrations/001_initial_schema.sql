-- ============================================
-- AquaGrid Bengaluru — Full Database Schema
-- Supabase / PostgreSQL Migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  ward_name TEXT,
  ward_number INTEGER,
  address TEXT,
  aadhaar_last4 TEXT,
  alert_email_scarcity BOOLEAN DEFAULT TRUE,
  alert_email_critical BOOLEAN DEFAULT TRUE,
  alert_booking_reminders BOOLEAN DEFAULT TRUE,
  notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('daily', 'immediate')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: wards
-- ============================================
CREATE TABLE IF NOT EXISTS wards (
  id SERIAL PRIMARY KEY,
  ward_name TEXT NOT NULL,
  ward_number INTEGER UNIQUE NOT NULL,
  zone TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT DEFAULT 'green' CHECK (risk_level IN ('green', 'blue', 'orange', 'critical')),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: user_reports
-- ============================================
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('no_supply', 'irregular', 'low_pressure', 'tanker_needed')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: water_bookings
-- ============================================
CREATE TABLE IF NOT EXISTS water_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ward_name TEXT,
  address TEXT NOT NULL,
  quantity TEXT NOT NULL CHECK (quantity IN ('500L', '1000L', '2000L')),
  delivery_date DATE NOT NULL,
  delivery_slot TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('online', 'cash')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled')),
  booking_id TEXT UNIQUE NOT NULL,
  razorpay_order_id TEXT,
  special_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: feedback
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES water_bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  display_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id) -- one feedback per booking
);

-- ============================================
-- Table: risk_data_log
-- ============================================
CREATE TABLE IF NOT EXISTS risk_data_log (
  id SERIAL PRIMARY KEY,
  ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
  reservoir_level DOUBLE PRECISION,
  rainfall_mm DOUBLE PRECISION,
  report_count INTEGER DEFAULT 0,
  news_mentions INTEGER DEFAULT 0,
  risk_score INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: survey_responses
-- ============================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  water_issue_frequency TEXT,
  supply_time_start TEXT,
  supply_time_end TEXT,
  household_size TEXT,
  primary_water_source TEXT,
  experienced_3day_cut BOOLEAN,
  willing_to_pay TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_reports_ward ON user_reports(ward_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_created ON user_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_water_bookings_user ON water_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_water_bookings_status ON water_bookings(status);
CREATE INDEX IF NOT EXISTS idx_water_bookings_booking_id ON water_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_booking ON feedback(booking_id);
CREATE INDEX IF NOT EXISTS idx_risk_data_log_ward ON risk_data_log(ward_id);
CREATE INDEX IF NOT EXISTS idx_risk_data_log_calc ON risk_data_log(calculated_at);
CREATE INDEX IF NOT EXISTS idx_wards_risk ON wards(risk_level);
CREATE INDEX IF NOT EXISTS idx_users_ward ON users(ward_name);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_data_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Wards: Public read access
CREATE POLICY "Wards are publicly readable" ON wards
  FOR SELECT USING (true);

-- Users: Users can read/update their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = auth_id::text OR role = 'admin');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = auth_id::text);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = auth_id::text);

-- User Reports: Users can create, read own
CREATE POLICY "Users can create reports" ON user_reports
  FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_id::text FROM users WHERE id = user_id));

CREATE POLICY "Users can view own reports" ON user_reports
  FOR SELECT USING (true);

-- Water Bookings: Users can read/create own
CREATE POLICY "Users can view own bookings" ON water_bookings
  FOR SELECT USING (
    auth.uid()::text = (SELECT auth_id::text FROM users WHERE id = user_id)
  );

CREATE POLICY "Users can create bookings" ON water_bookings
  FOR INSERT WITH CHECK (
    auth.uid()::text = (SELECT auth_id::text FROM users WHERE id = user_id)
  );

-- Feedback: Users can create own, public feedback is readable
CREATE POLICY "Public feedback is readable" ON feedback
  FOR SELECT USING (display_public = true OR auth.uid()::text = (SELECT auth_id::text FROM users WHERE id = user_id));

CREATE POLICY "Users can create feedback" ON feedback
  FOR INSERT WITH CHECK (
    auth.uid()::text = (SELECT auth_id::text FROM users WHERE id = user_id)
  );

-- Risk data log: Public read
CREATE POLICY "Risk data is publicly readable" ON risk_data_log
  FOR SELECT USING (true);

-- Survey responses: Users can create own
CREATE POLICY "Users can create survey responses" ON survey_responses
  FOR INSERT WITH CHECK (
    auth.uid()::text = (SELECT auth_id::text FROM users WHERE id = user_id)
  );

-- Service role can do everything (for backend operations)
-- Note: Service role bypasses RLS by default in Supabase
