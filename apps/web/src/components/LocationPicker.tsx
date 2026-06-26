'use client';

import { useState } from 'react';

export interface LatLng { lat: number; lng: number }

// Kandy town — used as the starting point / fallback (v1 region).
const KANDY: LatLng = { lat: 7.2906, lng: 80.635 };

/**
 * Location picker: tries the browser's GPS, with a manual coordinate fallback.
 * A full map picker (Google Maps) replaces the manual fields once the Maps key is wired.
 */
export function LocationPicker({
  value,
  onChange,
  label = 'Your location',
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  label?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'locating' | 'ok' | 'denied'>('idle');
  const loc = value ?? KANDY;

  function useMyLocation() {
    if (!('geolocation' in navigator)) { setStatus('denied'); return; }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => { onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setStatus('ok'); },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={useMyLocation}
        className="w-full rounded-base border px-3 py-2.5 text-sm font-medium hover:border-primary dark:border-gray-600"
      >
        {status === 'locating' ? 'Locating…' : 'Use my current location'}
      </button>

      {status === 'ok' && (
        <p className="text-xs text-success">Location set ({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}).</p>
      )}
      {status === 'denied' && (
        <p className="text-xs text-danger">Couldn&apos;t get GPS. Enter coordinates manually below.</p>
      )}

      {/* Manual fallback (replaced by a map picker when Google Maps is wired) */}
      <details className="text-xs text-gray-500 dark:text-gray-400">
        <summary className="cursor-pointer">Set location manually</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label>Latitude
            <input
              type="number" step="any" value={loc.lat}
              onChange={(e) => onChange({ ...loc, lat: Number(e.target.value) })}
              className="mt-1 w-full rounded-base border px-2 py-1.5 dark:border-gray-600 dark:bg-gray-900" />
          </label>
          <label>Longitude
            <input
              type="number" step="any" value={loc.lng}
              onChange={(e) => onChange({ ...loc, lng: Number(e.target.value) })}
              className="mt-1 w-full rounded-base border px-2 py-1.5 dark:border-gray-600 dark:bg-gray-900" />
          </label>
        </div>
      </details>
    </div>
  );
}

export { KANDY };
