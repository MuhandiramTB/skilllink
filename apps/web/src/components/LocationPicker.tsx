'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import 'leaflet/dist/leaflet.css';
import { nearestTown } from '@/lib/towns';

export interface LatLng { lat: number; lng: number }

// Kandy town — used as the starting point / fallback (v1 region).
const KANDY: LatLng = { lat: 7.2906, lng: 80.635 };

/**
 * Interactive map location picker (Leaflet + OpenStreetMap — free, no API key).
 * - A draggable indigo pin marks the chosen point; the map also moves the pin on tap.
 * - "Use my current location" recenters on GPS.
 * - Shows the nearest known area ("Detected: Kandy") so the user can confirm.
 * - A manual lat/lng fallback stays available for precision / no-JS cases.
 * Leaflet is loaded lazily on the client (it needs the DOM), so this is SSR-safe.
 */
export function LocationPicker({
  value,
  onChange,
  label,
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  label?: string;
}) {
  const t = useTranslations('loc');
  const loc = value ?? KANDY;
  const [status, setStatus] = useState<'idle' | 'locating' | 'ok' | 'denied'>('idle');
  const mapEl = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const detected = value ? nearestTown(value.lat, value.lng) : null;

  // Init the map once on mount.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapEl.current) return;

      // Indigo pin via divIcon (matches the design system; avoids Leaflet's
      // default marker image 404s with bundlers).
      const pin = L.divIcon({
        className: '',
        html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#4F46E5;border:3px solid #fff;box-shadow:0 2px 6px rgba(11,13,18,.4);transform:rotate(-45deg)"></div>',
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
    <div className="space-y-2.5">
      <span className="block text-sm font-semibold text-ink dark:text-gray-200">{label ?? t('yourLocation')}</span>

      {/* The map */}
      <div
        ref={mapEl}
        className="h-56 w-full overflow-hidden rounded-xl2 border border-line dark:border-gray-800"
        style={{ zIndex: 0 }}
      />

      {/* Detected area — reassures the user their point resolves to a known town. */}
      {detected && (
        <div className="flex items-center gap-2 rounded-base bg-primary-soft px-3 py-2 text-sm dark:bg-primary/10">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" /></svg>
          </span>
          <span className="text-slate">
            {t('detectedArea')} <span className="font-semibold text-ink dark:text-gray-100">{detected.town.name}</span>
            <span className="text-slate-2"> · {(detected.distanceM / 1000).toFixed(1)} km</span>
          </span>
        </div>
      )}

      <p className="text-xs text-slate">{t('mapHint')}</p>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={status === 'locating'}
        className="flex w-full items-center justify-center gap-2 rounded-base border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-100"
      >
        {status === 'locating' ? (
          <><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" aria-hidden="true" />{t('locating')}</>
        ) : (
          <><svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" /></svg>{t('useMyLocation')}</>
        )}
      </button>

      {status === 'ok' && (
        <p className="text-xs font-medium text-success">{t('locationSet', { lat: loc.lat.toFixed(4), lng: loc.lng.toFixed(4) })}</p>
      )}
      {status === 'denied' && (
        <p className="text-xs font-medium text-danger">{t('gpsFailed')}</p>
      )}

      {/* Manual fallback */}
      <details className="text-xs text-slate">
        <summary className="cursor-pointer select-none hover:text-ink dark:hover:text-gray-200">{t('enterManually')}</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-slate">{t('latitude')}
            <input
              type="number" step="any" value={loc.lat}
              onChange={(e) => onChange({ ...loc, lat: Number(e.target.value) })}
              className="mt-1 w-full rounded-base border border-line bg-white px-2 py-1.5 text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
          </label>
          <label className="text-slate">{t('longitude')}
            <input
              type="number" step="any" value={loc.lng}
              onChange={(e) => onChange({ ...loc, lng: Number(e.target.value) })}
              className="mt-1 w-full rounded-base border border-line bg-white px-2 py-1.5 text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
          </label>
        </div>
      </details>
    </div>
  );
}

export { KANDY };
