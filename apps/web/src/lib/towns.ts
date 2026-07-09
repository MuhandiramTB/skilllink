/**
 * Service-area towns across Sri Lanka (island-wide, all 25 districts). Providers
 * pick the towns they cover; each becomes a service area. Customers can search any
 * town. Coordinates are the town centre. Grouped by district for the pickers.
 *
 * Backward-compatible: existing consumers key off `key`/`name`/`lat`/`lng`; the
 * new `district` field is additive.
 */
export interface Town { key: string; name: string; district: string; lat: number; lng: number }

export const TOWNS: Town[] = [
  // ── Central ────────────────────────────────────────────────────────────────
  { key: 'kandy', name: 'Kandy', district: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { key: 'peradeniya', name: 'Peradeniya', district: 'Kandy', lat: 7.2599, lng: 80.5976 },
  { key: 'katugastota', name: 'Katugastota', district: 'Kandy', lat: 7.3167, lng: 80.6167 },
  { key: 'gampola', name: 'Gampola', district: 'Kandy', lat: 7.1642, lng: 80.5697 },
  { key: 'kadugannawa', name: 'Kadugannawa', district: 'Kandy', lat: 7.2547, lng: 80.5233 },
  { key: 'pilimatalawa', name: 'Pilimatalawa', district: 'Kandy', lat: 7.2680, lng: 80.5470 },
  { key: 'digana', name: 'Digana', district: 'Kandy', lat: 7.2870, lng: 80.7420 },
  { key: 'kundasale', name: 'Kundasale', district: 'Kandy', lat: 7.2833, lng: 80.6833 },
  { key: 'akurana', name: 'Akurana', district: 'Kandy', lat: 7.3660, lng: 80.6180 },
  { key: 'nawalapitiya', name: 'Nawalapitiya', district: 'Kandy', lat: 7.0540, lng: 80.5340 },
  { key: 'matale', name: 'Matale', district: 'Matale', lat: 7.4675, lng: 80.6234 },
  { key: 'dambulla', name: 'Dambulla', district: 'Matale', lat: 7.8742, lng: 80.6511 },
  { key: 'galewela', name: 'Galewela', district: 'Matale', lat: 7.7500, lng: 80.5667 },
  { key: 'nuwara_eliya', name: 'Nuwara Eliya', district: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891 },
  { key: 'hatton', name: 'Hatton', district: 'Nuwara Eliya', lat: 6.8917, lng: 80.5956 },
  { key: 'talawakele', name: 'Talawakele', district: 'Nuwara Eliya', lat: 6.9350, lng: 80.6600 },

  // ── Western ──────────────────────────────────────────────────────────────
  { key: 'colombo', name: 'Colombo', district: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { key: 'dehiwala', name: 'Dehiwala', district: 'Colombo', lat: 6.8511, lng: 79.8653 },
  { key: 'moratuwa', name: 'Moratuwa', district: 'Colombo', lat: 6.7730, lng: 79.8816 },
  { key: 'kotte', name: 'Sri Jayawardenepura Kotte', district: 'Colombo', lat: 6.8905, lng: 79.9018 },
  { key: 'maharagama', name: 'Maharagama', district: 'Colombo', lat: 6.8480, lng: 79.9265 },
  { key: 'homagama', name: 'Homagama', district: 'Colombo', lat: 6.8441, lng: 80.0028 },
  { key: 'kaduwela', name: 'Kaduwela', district: 'Colombo', lat: 6.9333, lng: 79.9833 },
  { key: 'gampaha', name: 'Gampaha', district: 'Gampaha', lat: 7.0917, lng: 79.9994 },
  { key: 'negombo', name: 'Negombo', district: 'Gampaha', lat: 7.2083, lng: 79.8358 },
  { key: 'ja_ela', name: 'Ja-Ela', district: 'Gampaha', lat: 7.0744, lng: 79.8919 },
  { key: 'wattala', name: 'Wattala', district: 'Gampaha', lat: 6.9897, lng: 79.8917 },
  { key: 'kelaniya', name: 'Kelaniya', district: 'Gampaha', lat: 6.9553, lng: 79.9219 },
  { key: 'minuwangoda', name: 'Minuwangoda', district: 'Gampaha', lat: 7.1667, lng: 79.9500 },
  { key: 'kalutara', name: 'Kalutara', district: 'Kalutara', lat: 6.5854, lng: 79.9607 },
  { key: 'panadura', name: 'Panadura', district: 'Kalutara', lat: 6.7133, lng: 79.9042 },
  { key: 'horana', name: 'Horana', district: 'Kalutara', lat: 6.7156, lng: 80.0622 },
  { key: 'beruwala', name: 'Beruwala', district: 'Kalutara', lat: 6.4788, lng: 79.9828 },

  // ── Southern ─────────────────────────────────────────────────────────────
  { key: 'galle', name: 'Galle', district: 'Galle', lat: 6.0535, lng: 80.2210 },
  { key: 'hikkaduwa', name: 'Hikkaduwa', district: 'Galle', lat: 6.1395, lng: 80.1063 },
  { key: 'ambalangoda', name: 'Ambalangoda', district: 'Galle', lat: 6.2354, lng: 80.0537 },
  { key: 'elpitiya', name: 'Elpitiya', district: 'Galle', lat: 6.2917, lng: 80.1667 },
  { key: 'matara', name: 'Matara', district: 'Matara', lat: 5.9549, lng: 80.5550 },
  { key: 'weligama', name: 'Weligama', district: 'Matara', lat: 5.9750, lng: 80.4297 },
  { key: 'akuressa', name: 'Akuressa', district: 'Matara', lat: 6.1000, lng: 80.4833 },
  { key: 'hambantota', name: 'Hambantota', district: 'Hambantota', lat: 6.1241, lng: 81.1185 },
  { key: 'tangalle', name: 'Tangalle', district: 'Hambantota', lat: 6.0240, lng: 80.7940 },
  { key: 'tissamaharama', name: 'Tissamaharama', district: 'Hambantota', lat: 6.2778, lng: 81.2872 },

  // ── Northern ─────────────────────────────────────────────────────────────
  { key: 'jaffna', name: 'Jaffna', district: 'Jaffna', lat: 9.6615, lng: 80.0255 },
  { key: 'chavakachcheri', name: 'Chavakachcheri', district: 'Jaffna', lat: 9.6583, lng: 80.1636 },
  { key: 'point_pedro', name: 'Point Pedro', district: 'Jaffna', lat: 9.8167, lng: 80.2333 },
  { key: 'kilinochchi', name: 'Kilinochchi', district: 'Kilinochchi', lat: 9.3803, lng: 80.3770 },
  { key: 'mannar', name: 'Mannar', district: 'Mannar', lat: 8.9810, lng: 79.9044 },
  { key: 'vavuniya', name: 'Vavuniya', district: 'Vavuniya', lat: 8.7514, lng: 80.4971 },
  { key: 'mullaitivu', name: 'Mullaitivu', district: 'Mullaitivu', lat: 9.2671, lng: 80.8142 },

  // ── Eastern ──────────────────────────────────────────────────────────────
  { key: 'trincomalee', name: 'Trincomalee', district: 'Trincomalee', lat: 8.5874, lng: 81.2152 },
  { key: 'kinniya', name: 'Kinniya', district: 'Trincomalee', lat: 8.4939, lng: 81.1808 },
  { key: 'batticaloa', name: 'Batticaloa', district: 'Batticaloa', lat: 7.7170, lng: 81.7000 },
  { key: 'kattankudy', name: 'Kattankudy', district: 'Batticaloa', lat: 7.6822, lng: 81.7286 },
  { key: 'ampara', name: 'Ampara', district: 'Ampara', lat: 7.2917, lng: 81.6725 },
  { key: 'kalmunai', name: 'Kalmunai', district: 'Ampara', lat: 7.4167, lng: 81.8167 },

  // ── North Western ────────────────────────────────────────────────────────
  { key: 'kurunegala', name: 'Kurunegala', district: 'Kurunegala', lat: 7.4863, lng: 80.3647 },
  { key: 'kuliyapitiya', name: 'Kuliyapitiya', district: 'Kurunegala', lat: 7.4700, lng: 80.0400 },
  { key: 'narammala', name: 'Narammala', district: 'Kurunegala', lat: 7.4333, lng: 80.2167 },
  { key: 'puttalam', name: 'Puttalam', district: 'Puttalam', lat: 8.0362, lng: 79.8283 },
  { key: 'chilaw', name: 'Chilaw', district: 'Puttalam', lat: 7.5758, lng: 79.7953 },
  { key: 'wennappuwa', name: 'Wennappuwa', district: 'Puttalam', lat: 7.3406, lng: 79.8442 },

  // ── North Central ────────────────────────────────────────────────────────
  { key: 'anuradhapura', name: 'Anuradhapura', district: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
  { key: 'kekirawa', name: 'Kekirawa', district: 'Anuradhapura', lat: 8.0389, lng: 80.5931 },
  { key: 'polonnaruwa', name: 'Polonnaruwa', district: 'Polonnaruwa', lat: 7.9403, lng: 81.0188 },
  { key: 'kaduruwela', name: 'Kaduruwela', district: 'Polonnaruwa', lat: 7.9333, lng: 81.0500 },

  // ── Uva ──────────────────────────────────────────────────────────────────
  { key: 'badulla', name: 'Badulla', district: 'Badulla', lat: 6.9934, lng: 81.0550 },
  { key: 'bandarawela', name: 'Bandarawela', district: 'Badulla', lat: 6.8294, lng: 80.9869 },
  { key: 'ella', name: 'Ella', district: 'Badulla', lat: 6.8667, lng: 81.0466 },
  { key: 'monaragala', name: 'Monaragala', district: 'Monaragala', lat: 6.8714, lng: 81.3487 },
  { key: 'wellawaya', name: 'Wellawaya', district: 'Monaragala', lat: 6.7369, lng: 81.1036 },

  // ── Sabaragamuwa ─────────────────────────────────────────────────────────
  { key: 'ratnapura', name: 'Ratnapura', district: 'Ratnapura', lat: 6.6828, lng: 80.3992 },
  { key: 'embilipitiya', name: 'Embilipitiya', district: 'Ratnapura', lat: 6.3436, lng: 80.8492 },
  { key: 'balangoda', name: 'Balangoda', district: 'Ratnapura', lat: 6.6500, lng: 80.7000 },
  { key: 'kegalle', name: 'Kegalle', district: 'Kegalle', lat: 7.2513, lng: 80.3464 },
  { key: 'mawanella', name: 'Mawanella', district: 'Kegalle', lat: 7.2500, lng: 80.4500 },
  { key: 'warakapola', name: 'Warakapola', district: 'Kegalle', lat: 7.2256, lng: 80.1953 },
];

/** District names in display order (island-wide), derived from TOWNS. */
export const DISTRICTS: string[] = Array.from(new Set(TOWNS.map((t) => t.district)));

/** Towns grouped by district — for the district-grouped pickers. */
export function townsByDistrict(): { district: string; towns: Town[] }[] {
  return DISTRICTS.map((district) => ({
    district,
    towns: TOWNS.filter((t) => t.district === district),
  }));
}

/**
 * Nearest town to a coordinate, via the haversine great-circle distance. Used to
 * tell a customer which area their picked/GPS point resolves to ("Detected: Kandy")
 * so they can confirm before searching. Returns the town + distance in metres.
 */
export function nearestTown(lat: number, lng: number): { town: Town; distanceM: number } {
  const R = 6371000; // Earth radius (m)
  const toRad = (d: number) => (d * Math.PI) / 180;
  let best = TOWNS[0];
  let bestD = Infinity;
  for (const tn of TOWNS) {
    const dLat = toRad(tn.lat - lat);
    const dLng = toRad(tn.lng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(tn.lat)) * Math.sin(dLng / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (d < bestD) { bestD = d; best = tn; }
  }
  return { town: best, distanceM: Math.round(bestD) };
}
