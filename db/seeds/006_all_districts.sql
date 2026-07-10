-- ============================================================================
-- 006: seed all 25 Sri Lankan districts (inactive by default).
-- Kandy/Colombo/Gampaha may already exist from seed 001 — ON CONFLICT-free via a
-- NOT EXISTS guard on name_en so this is idempotent and safe to re-run. Admins
-- activate a district from the console (is_active toggle already exists) to open
-- matching there. Centres are approximate district-capital coords (lng, lat) WGS84.
-- ============================================================================

INSERT INTO districts (name_en, name_si, name_ta, center, is_active)
SELECT d.en, d.si, d.ta, ST_SetSRID(ST_MakePoint(d.lng, d.lat), 4326)::geography, false
FROM (VALUES
  ('Kandy',        'මහනුවර',       'கண்டி',           80.6337, 7.2906),
  ('Colombo',      'කොළඹ',         'கொழும்பு',        79.8612, 6.9271),
  ('Gampaha',      'ගම්පහ',        'கம்பஹா',          79.9990, 7.0917),
  ('Kalutara',     'කළුතර',        'களுத்துறை',       79.9607, 6.5854),
  ('Matale',       'මාතලේ',        'மாத்தளை',         80.6234, 7.4675),
  ('Nuwara Eliya', 'නුවරඑළිය',     'நுவரெலியா',       80.7891, 6.9497),
  ('Galle',        'ගාල්ල',        'காலி',            80.2210, 6.0535),
  ('Matara',       'මාතර',         'மாத்தறை',         80.5550, 5.9549),
  ('Hambantota',   'හම්බන්තොට',    'அம்பாந்தோட்டை',   81.1185, 6.1241),
  ('Jaffna',       'යාපනය',        'யாழ்ப்பாணம்',      80.0255, 9.6615),
  ('Kilinochchi',  'කිලිනොච්චිය',  'கிளிநொச்சி',       80.3770, 9.3803),
  ('Mannar',       'මන්නාරම',      'மன்னார்',          79.9044, 8.9810),
  ('Vavuniya',     'වවුනියාව',     'வவுனியா',         80.4971, 8.7514),
  ('Mullaitivu',   'මුලතිව්',      'முல்லைத்தீவு',     80.8142, 9.2671),
  ('Batticaloa',   'මඩකලපුව',      'மட்டக்களப்பு',    81.7000, 7.7170),
  ('Ampara',       'අම්පාර',       'அம்பாறை',          81.6725, 7.2917),
  ('Trincomalee',  'ත්‍රිකුණාමලය', 'திருகோணமலை',      81.2152, 8.5874),
  ('Kurunegala',   'කුරුණෑගල',     'குருணாகல்',        80.3647, 7.4863),
  ('Puttalam',     'පුත්තලම',      'புத்தளம்',         79.8283, 8.0362),
  ('Anuradhapura', 'අනුරාධපුරය',   'அனுராதபுரம்',      80.4037, 8.3114),
  ('Polonnaruwa',  'පොළොන්නරුව',   'பொலன்னறுவை',      81.0188, 7.9403),
  ('Badulla',      'බදුල්ල',       'பதுளை',            81.0550, 6.9934),
  ('Monaragala',   'මොනරාගල',      'மொணராகலை',        81.3487, 6.8714),
  ('Ratnapura',    'රත්නපුර',      'இரத்தினபுரி',      80.3992, 6.6828),
  ('Kegalle',      'කෑගල්ල',       'கேகாலை',           80.3464, 7.2513)
) AS d(en, si, ta, lng, lat)
WHERE NOT EXISTS (SELECT 1 FROM districts x WHERE x.name_en = d.en);
