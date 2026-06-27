'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export interface LatLng { lat: number; lng: number }

// Kandy town — used as the starting point / fallback (v1 region).
const KANDY: LatLng = { lat: 7.2906, lng: 80.635 };

/**
 * Interactive map location picker (Leaflet + OpenStreetMap — free, no API key).
 * - A draggable pin marks the chosen point; the map also moves the pin on tap/click.
 * - "Use my current location" recenters on GPS.
 * - A manual lat/lng fallback stays available for precision/no-JS cases.
 * Leaflet is loaded lazily on the client (it needs the DOM), so this is SSR-safe.
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
  const loc = value ?? KANDY;
  const [status, setStatus] = useState<'idle' | 'locating' | 'ok' | 'denied'>('idle');
  const mapEl = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Init the map once on mount.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapEl.current) return;

      // A teal pin via divIcon (avoids Leaflet's default marker image 404s with bundlers).
      const pin = L.divIcon({
        className: '',
        html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#0F766E;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 24],
      });

      const map = L.map(mapEl.current, { attributionControl: true }).setView([loc.lat, loc.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      const marker = L.marker([loc.lat, loc.lng], { draggable: true, icon: pin }).addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onChangeRef.current({ lat: p.lat, lng: p.lng });
      });
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRef.current = map;
      markerRef.current = marker;
      // Leaflet sometimes mis-sizes in a flex/animated container — nudge it.
      setTimeout(() => map.invalidateSize(), 200);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the map/pin in sync when value changes from outside (e.g. GPS button).
  useEffect(() => {
    if (mapRef.current && markerRef.current && value) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom());
    }
  }, [value?.lat, value?.lng]);

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

      {/* The map */}
      <div
        ref={mapEl}
        className="h-56 w-full overflow-hidden rounded-base border dark:border-gray-600"
        style={{ zIndex: 0 }}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">Tap the map or drag the pin to set the exact spot.</p>

      <button
        type="button"
        onClick={useMyLocation}
        className="w-full rounded-base border px-3 py-2.5 text-sm font-medium hover:border-primary dark:border-gray-600"
      >
        {status === 'locating' ? 'Locating…' : '📍 Use my current location'}
      </button>

      {status === 'ok' && (
        <p className="text-xs text-success">Location set ({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}).</p>
      )}
      {status === 'denied' && (
        <p className="text-xs text-danger">Couldn&apos;t get GPS. Use the map or enter coordinates below.</p>
      )}

      {/* Manual fallback */}
      <details className="text-xs text-gray-500 dark:text-gray-400">
        <summary className="cursor-pointer">Enter coordinates manually</summary>
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
