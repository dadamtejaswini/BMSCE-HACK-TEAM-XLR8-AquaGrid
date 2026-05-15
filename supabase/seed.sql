-- ============================================
-- AquaGrid — Seed Data: Bengaluru Wards
-- 15+ real wards with realistic coordinates
-- ============================================

INSERT INTO wards (ward_name, ward_number, zone, lat, lng, risk_score, risk_level, last_updated) VALUES
  ('Koramangala',       150, 'South',      12.9352, 77.6245, 72, 'orange',   NOW()),
  ('Indiranagar',       82,  'East',       12.9784, 77.6408, 35, 'blue',     NOW()),
  ('Whitefield',        85,  'East',       12.9698, 77.7500, 82, 'critical', NOW()),
  ('Marathahalli',      84,  'East',       12.9591, 77.7009, 65, 'orange',   NOW()),
  ('HSR Layout',        174, 'South',      12.9116, 77.6389, 58, 'orange',   NOW()),
  ('Jayanagar',         170, 'South',      12.9308, 77.5838, 22, 'green',    NOW()),
  ('Rajajinagar',       45,  'West',       12.9866, 77.5527, 30, 'blue',     NOW()),
  ('Yelahanka',         4,   'North',      13.1007, 77.5963, 78, 'critical', NOW()),
  ('Hebbal',            24,  'North',      13.0358, 77.5970, 45, 'blue',     NOW()),
  ('Electronic City',   192, 'South',      12.8440, 77.6593, 85, 'critical', NOW()),
  ('Bellandur',         150, 'South-East', 12.9260, 77.6762, 68, 'orange',   NOW()),
  ('BTM Layout',        176, 'South',      12.9166, 77.6101, 40, 'blue',     NOW()),
  ('Malleswaram',       40,  'West',       13.0035, 77.5701, 20, 'green',    NOW()),
  ('Vijayanagar',       98,  'West',       12.9719, 77.5323, 28, 'blue',     NOW()),
  ('Banashankari',      159, 'South',      12.9255, 77.5468, 33, 'blue',     NOW()),
  ('KR Puram',          57,  'East',       13.0077, 77.6969, 55, 'orange',   NOW()),
  ('Mahadevapura',      83,  'East',       12.9927, 77.6816, 75, 'orange',   NOW()),
  ('Bommanahalli',      193, 'South',      12.8980, 77.6173, 62, 'orange',   NOW()),
  ('RR Nagar',          128, 'West',       12.9578, 77.5079, 42, 'blue',     NOW()),
  ('Shivajinagar',      80,  'Central',    12.9857, 77.6052, 25, 'green',    NOW())
ON CONFLICT (ward_number) DO UPDATE SET
  ward_name = EXCLUDED.ward_name,
  zone = EXCLUDED.zone,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  risk_score = EXCLUDED.risk_score,
  risk_level = EXCLUDED.risk_level,
  last_updated = NOW();
