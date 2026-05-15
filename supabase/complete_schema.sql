-- ============================================
-- AquaGrid Bengaluru — Complete Database Schema
-- Paste this ENTIRE file into Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================

-- USERS (extends Supabase auth.users)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  ward_name text,
  ward_number integer,
  address text,
  aadhaar_last4 text,
  alert_on_scarcity boolean DEFAULT true,
  alert_on_critical boolean DEFAULT true,
  booking_reminders boolean DEFAULT true,
  notification_frequency text DEFAULT 'immediate',
  preferred_language text DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- WARDS
CREATE TABLE public.wards (
  id serial PRIMARY KEY,
  ward_name text NOT NULL,
  ward_number integer,
  zone text,
  lat float NOT NULL,
  lng float NOT NULL,
  risk_score integer DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level text DEFAULT 'blue' CHECK (risk_level IN ('green','blue','orange','critical')),
  last_updated timestamptz DEFAULT now()
);
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view wards" ON public.wards FOR SELECT USING (true);
CREATE POLICY "Admin can update wards" ON public.wards FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- USER REPORTS (logged in OR anonymous)
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ward_id integer REFERENCES public.wards(id),
  ward_name text,
  reporter_name text,
  reporter_phone text,
  report_type text CHECK (report_type IN 
    ('no_supply','irregular','low_pressure','tanker_needed','other')),
  description text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert reports" ON public.user_reports
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view reports" ON public.user_reports
  FOR SELECT USING (true);

-- WATER BOOKINGS
CREATE TABLE public.water_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  booking_id text UNIQUE NOT NULL,
  ward_name text,
  address text,
  quantity text CHECK (quantity IN ('500L','1000L','2000L')),
  delivery_date date,
  delivery_slot text,
  special_notes text,
  status text DEFAULT 'pending' CHECK (status IN 
    ('pending','confirmed','out_for_delivery','delivered','cancelled')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.water_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.water_bookings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON public.water_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can view all bookings" ON public.water_bookings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- FEEDBACK
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.water_bookings(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  display_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id)
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view public feedback" ON public.feedback
  FOR SELECT USING (display_public = true);

-- QUERIES
CREATE TABLE public.queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.water_bookings(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  email text,
  query_type text CHECK (query_type IN 
    ('booking_related','delivery_issue','water_quality','other')),
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert queries" ON public.queries
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own queries" ON public.queries
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admin can view all queries" ON public.queries
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RISK DATA LOG
CREATE TABLE public.risk_data_log (
  id serial PRIMARY KEY,
  ward_id integer REFERENCES public.wards(id),
  reservoir_level float,
  rainfall_mm float,
  report_count integer,
  risk_score integer,
  calculated_at timestamptz DEFAULT now()
);

-- SURVEY RESPONSES
CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  supply_frequency text,
  supply_time_start text,
  supply_time_end text,
  household_size integer,
  primary_source text,
  experienced_long_cut boolean,
  willing_to_pay text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own survey" ON public.survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ENABLE REALTIME on water_bookings and queries
ALTER PUBLICATION supabase_realtime ADD TABLE public.water_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queries;

-- SEED WARDS DATA
INSERT INTO public.wards (ward_name, ward_number, zone, lat, lng, risk_score, risk_level) VALUES
('Koramangala', 68, 'South', 12.9352, 77.6245, 45, 'blue'),
('Whitefield', 84, 'East', 12.9698, 77.7500, 78, 'critical'),
('Indiranagar', 75, 'East', 12.9784, 77.6408, 35, 'green'),
('Hebbal', 6, 'North', 13.0353, 77.5970, 60, 'orange'),
('Electronic City', 150, 'South', 12.8399, 77.6770, 80, 'critical'),
('Jayanagar', 56, 'South', 12.9308, 77.5831, 28, 'green'),
('Marathahalli', 82, 'East', 12.9591, 77.6974, 68, 'orange'),
('Yelahanka', 3, 'North', 13.1005, 77.5963, 63, 'orange'),
('BTM Layout', 67, 'South', 12.9166, 77.6101, 50, 'blue'),
('Malleswaram', 28, 'West', 13.0032, 77.5655, 25, 'green'),
('HSR Layout', 72, 'South', 12.9116, 77.6389, 55, 'blue'),
('Rajajinagar', 30, 'West', 12.9923, 77.5518, 38, 'green'),
('Banashankari', 55, 'South', 12.9256, 77.5462, 48, 'blue'),
('Bellandur', 85, 'East', 12.9259, 77.6762, 72, 'orange'),
('Vijayanagar', 32, 'West', 12.9719, 77.5161, 36, 'green'),
('Sarjapur Road', 87, 'East', 12.9010, 77.6920, 75, 'critical'),
('Kanakapura Road', 153, 'South', 12.8730, 77.5920, 65, 'orange'),
('Ulsoor', 74, 'Central', 12.9830, 77.6210, 30, 'green'),
('Basavanagudi', 52, 'South', 12.9422, 77.5747, 27, 'green'),
('Hosur Road', 151, 'South', 12.8960, 77.6410, 70, 'orange');
