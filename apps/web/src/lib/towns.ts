/**
 * Towns a provider can select as service areas (Kandy district, v1). Each has a
 * center coordinate; picking towns creates one service area per town. Expandable
 * as the platform launches new districts.
 */
export interface Town { key: string; name: string; lat: number; lng: number }

export const TOWNS: Town[] = [
  { key: 'kandy', name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { key: 'peradeniya', name: 'Peradeniya', lat: 7.2599, lng: 80.5976 },
  { key: 'katugastota', name: 'Katugastota', lat: 7.3167, lng: 80.6167 },
  { key: 'gampola', name: 'Gampola', lat: 7.1642, lng: 80.5697 },
  { key: 'kadugannawa', name: 'Kadugannawa', lat: 7.2547, lng: 80.5233 },
  { key: 'pilimatalawa', name: 'Pilimatalawa', lat: 7.2680, lng: 80.5470 },
  { key: 'digana', name: 'Digana', lat: 7.2870, lng: 80.7420 },
  { key: 'kundasale', name: 'Kundasale', lat: 7.2833, lng: 80.6833 },
  { key: 'akurana', name: 'Akurana', lat: 7.3660, lng: 80.6180 },
  { key: 'nawalapitiya', name: 'Nawalapitiya', lat: 7.0540, lng: 80.5340 },
];

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
