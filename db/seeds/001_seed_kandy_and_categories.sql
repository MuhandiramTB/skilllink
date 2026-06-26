-- ============================================================================
-- Seed data — v1 Kandy district + service categories (incl. Solar)
-- Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- DISTRICTS: Kandy active (v1). Others inserted but inactive (flip later).
-- Coordinates are approximate district centres (lng, lat) WGS84.
-- ---------------------------------------------------------------------------
INSERT INTO districts (name_en, name_si, name_ta, center, is_active, launched_at)
VALUES
  ('Kandy',   'මහනුවර',  'கண்டி',     ST_SetSRID(ST_MakePoint(80.6350, 7.2906), 4326)::geography, true,  now()),
  ('Colombo', 'කොළඹ',    'கொழும்பு', ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)::geography, false, NULL),
  ('Gampaha', 'ගම්පහ',   'கம்பஹா',   ST_SetSRID(ST_MakePoint(79.9990, 7.0917), 4326)::geography, false, NULL)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- CATEGORIES — top-level trades
-- ---------------------------------------------------------------------------
INSERT INTO categories (key, name_en, name_si, name_ta, sort_order) VALUES
  ('electrician',   'Electrician',        'විදුලි කාර්මික',     'மின் கம்மியர்',    10),
  ('plumber',       'Plumber',            'ජල නල කාර්මික',      'குழாய் பணியாளர்',  20),
  ('ac_tech',       'AC Technician',      'වායුසමීකරණ කාර්මික', 'ஏசி தொழில்நுட்பர்', 30),
  ('welder',        'Welder',             'වෑල්ඩින් කාර්මික',   'வெல்டர்',          40),
  ('carpenter',     'Carpenter',          'වඩු කාර්මික',        'தச்சர்',            50),
  ('mechanic',      'Mechanic',           'යාන්ත්‍රික',          'இயந்திரவியலாளர்',  60),
  ('auto_ac',       'Auto AC Technician', 'වාහන වායුසමීකරණ',    'வாகன ஏசி',         70),
  ('painter',       'Painter',            'තීන්ත ආලේපක',        'ஓவியர்',           80),
  ('mason',         'Mason',              'පෙදරේරු',            'கொத்தனார்',        90),
  ('cctv',          'CCTV Installer',     'CCTV ස්ථාපක',        'சிசிடிவி நிறுவுநர்', 100),
  ('cleaning',      'Cleaning',           'පිරිසිදු කිරීම',      'சுத்தம்',           110),
  ('solar',         'Solar Services',     'සූර්ය සේවා',         'சூரிய சேவைகள்',     120)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- CATEGORIES — Solar sub-categories (parent = 'solar')
-- ---------------------------------------------------------------------------
INSERT INTO categories (parent_id, key, name_en, name_si, name_ta, sort_order)
SELECT s.id, v.key, v.en, v.si, v.ta, v.ord
FROM (SELECT id FROM categories WHERE key = 'solar') s,
     (VALUES
        ('solar.installation',   'Solar Installation',   'සූර්ය ස්ථාපනය',        'சூரிய நிறுவல்',         1),
        ('solar.maintenance',    'Solar Maintenance',    'සූර්ය නඩත්තුව',        'சூரிய பராமரிப்பு',      2),
        ('solar.cleaning',       'Solar Cleaning',       'සූර්ය පැනල පිරිසිදු',  'சூரிய சுத்தம்',         3),
        ('solar.inverter_repair','Inverter Repair',      'ඉන්වර්ටර් අලුත්වැඩියා','இன்வர்ட்டர் பழுது',     4),
        ('solar.battery',        'Battery Replacement',  'බැටරි ප්‍රතිස්ථාපනය',  'பேட்டரி மாற்றம்',       5),
        ('solar.net_metering',   'Net Metering Support', 'නෙට් මීටරින් සහාය',    'நெட் மீட்டரிங் ஆதரவு',  6),
        ('solar.ev_charger',     'EV Charger Installation','EV චාජර් ස්ථාපනය',   'EV சார்ஜர் நிறுவல்',    7)
     ) AS v(key, en, si, ta, ord)
ON CONFLICT (key) DO NOTHING;
