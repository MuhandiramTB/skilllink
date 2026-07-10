'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import 'leaflet/dist/leaflet.css';
import { nearestTown } from '@/lib/towns';

export interface LatLng { lat: number; lng: number }
export interface AddressValue {
  lat: number;
  lng: number;
  addressText?: string;   // resolved/searched place name
  addressNotes?: string;  // house/flat no., landmark, directions
}

const KANDY: LatLng = { lat: 7.2906, lng: 80.635 };
const NOMINATIM = 'https://nominatim.openstreetmap.org';

/**
 * Uber-style service-address picker (free OpenStreetMap — no API key):
 *  1. Search box → live place suggestions (Nominatim), tap to locate.
 *  2. "Use my current location" → reliable GPS with a "you are here" accuracy ring.
 *  3. Draggable map pin → drop the exact spot; the address name reverse-geocodes.
 *  4. Detail fields (house/flat no. + landmark/directions) so the provider finds it.
 * Emits { lat, lng, addressText, addressNotes } upward on every change.
 */
export function AddressPicker({
  value,
  onChange,
  label,
}: {
  value: AddressValue | null;
  onChange: (v: AddressValue) => void;
  label?: string;
}) {
  const t = useTranslations('loc');
  const loc = value ?? { ...KANDY };
  const [status, setStatus] = useState<'idle' | 'locating' | 'ok' | 'denied' | 'unavailable' | 'timeout'>('idle');
  const [query, setQuery] = useState(value?.addressText ?? '');
  const [suggests, setSuggests] = useState<{ display: string; lat: number; lng: number }[]>([]);
  const [openSug, setOpenSug] = useState(false);
  const [notes, setNotes] = useState(value?.addressNotes ?? '');
  const [resolving, setResolving] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accuracyRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const geocodeTimer = useRef<ReturnType<typeof setTimeout>>();

  const detected = value ? nearestTown(value.lat, value.lng) : null;

  // Emit the full value upward (keeps parent in sync with pin + text + notes).
  function emit(next: Partial<AddressValue>) {
    onChangeRef.current({ lat: loc.lat, lng: loc.lng, addressText: query, addressNotes: notes, ...next });
  }

  // ---- Reverse geocode: pin → real address (debounced, best-effort) ----
  async function reverseGeocode(lat: number, lng: number) {
    setResolving(true);
    try {
      const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' },
      });
      const j = await r.json();
      const name: string | undefined = j?.display_name;
      if (name) { setQuery(name); onChangeRef.current({ lat, lng, addressText: name, addressNotes: notes }); }
    } catch { /* keep coords-only if geocoding fails */ }
    finally { setResolving(false); }
  }

  function setPoint(lat: number, lng: number, opts: { geocode?: boolean } = { geocode: true }) {
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (mapRef.current) mapRef.current.setView([lat, lng], mapRef.current.getZoom() < 14 ? 15 : mapRef.current.getZoom());
    onChangeRef.current({ lat, lng, addressText: query, addressNotes: notes });
    if (opts.geocode) {
      clearTimeout(geocodeTimer.current);
      geocodeTimer.current = setTimeout(() => reverseGeocode(lat, lng), 500);
    }
  }

  // ---- Map init (once) ----
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapEl.current) return;
      const pin = L.divIcon({
        className: '',
        html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#4F46E5;border:3px solid #fff;box-shadow:0 2px 6px rgba(11,13,18,.4);transform:rotate(-45deg)"></div>',
        iconSize: [26, 26], iconAnchor: [13, 24],
      });
      const map = L.map(mapEl.current, { attributionControl: true }).setView([loc.lat, loc.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
      const marker = L.marker([loc.lat, loc.lng], { draggable: true, icon: pin }).addTo(map);
      marker.on('dragend', () => { const p = marker.getLatLng(); setPoint(p.lat, p.lng); });
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => setPoint(e.latlng.lat, e.latlng.lng));
      mapRef.current = map; markerRef.current = marker;
      setTimeout(() => map.invalidateSize(), 200);
    })();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; accuracyRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep pin in sync if the value changes from outside (e.g. ?loc handoff).
  useEffect(() => {
    if (mapRef.current && markerRef.current && value) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  // ---- Search autocomplete (debounced Nominatim, biased to Sri Lanka) ----
  useEffect(() => {
    const q = query.trim();
    // Don't search when the box just holds a resolved full address.
    if (q.length < 3 || q === value?.addressText) { setSuggests([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`${NOMINATIM}/search?format=jsonv2&countrycodes=lk&limit=6&q=${encodeURIComponent(q)}`, {
          headers: { 'Accept-Language': 'en' },
        });
        const j = await r.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSuggests((j ?? []).map((s: any) => ({ display: s.display_name, lat: +s.lat, lng: +s.lon })));
        setOpenSug(true);
      } catch { setSuggests([]); }
    }, 450);
    return () => clearTimeout(searchTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ---- Reliable GPS with specific error states + accuracy ring ----
  async function useMyLocation() {
    if (!('geolocation' in navigator)) { setStatus('unavailable'); return; }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setStatus('ok');
        // Draw a "you are here" accuracy ring.
        if (mapRef.current) {
          const L = (await import('leaflet')).default;
          if (accuracyRef.current) accuracyRef.current.remove();
          accuracyRef.current = L.circle([lat, lng], { radius: Math.min(accuracy, 200), color: '#4F46E5', weight: 1, fillColor: '#4F46E5', fillOpacity: 0.12 }).addTo(mapRef.current);
        }
        setPoint(lat, lng);
      },
      (err) => {
        // 1 = denied, 2 = position unavailable, 3 = timeout
        setStatus(err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-2.5">
      <span className="block text-sm font-semibold text-ink dark:text-gray-200">{label ?? t('serviceAddress')}</span>

      {/* Search box */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-base border border-line bg-white px-3 py-2.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 dark:border-gray-700 dark:bg-gray-900">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0 text-slate" aria-hidden="true"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" /></svg>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpenSug(true); }}
            onFocus={() => suggests.length && setOpenSug(true)}
            placeholder={t('searchAddress')}
            className="w-full border-none bg-transparent p-0 text-sm text-ink placeholder:text-slate/60 focus:outline-none focus:ring-0 dark:text-gray-100"
            type="text" autoComplete="off"
          />
          {resolving && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary/40 border-t-primary" aria-hidden="true" />}
        </div>
        {openSug && suggests.length > 0 && (
          <ul className="absolute left-0 top-full z-30 mt-1.5 max-h-60 w-full overflow-auto rounded-xl2 border border-line bg-white p-1.5 shadow-lift dark:border-gray-800 dark:bg-gray-900">
            {suggests.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => { setQuery(s.display); setOpenSug(false); setSuggests([]); setPoint(s.lat, s.lng, { geocode: false }); }}
                  className="flex w-full items-start gap-2 rounded-base px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-surface dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate" aria-hidden="true"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" /></svg>
                  <span className="line-clamp-2">{s.display}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Use my location */}
      <button
        type="button"
        onClick={useMyLocation}
        disabled={status === 'locating'}
        className="flex w-full items-center justify-center gap-2 rounded-base border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-100"
      >
        {status === 'locating'
          ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" aria-hidden="true" />{t('locating')}</>
          : <><svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" /></svg>{t('useMyLocation')}</>}
      </button>
      {status === 'denied' && <p className="text-xs font-medium text-danger">{t('gpsDenied')}</p>}
      {status === 'timeout' && <p className="text-xs font-medium text-warn">{t('gpsTimeout')}</p>}
      {status === 'unavailable' && <p className="text-xs font-medium text-danger">{t('gpsUnavailable')}</p>}

      {/* Map */}
      <div ref={mapEl} className="h-56 w-full overflow-hidden rounded-xl2 border border-line dark:border-gray-800" style={{ zIndex: 0 }} />

      {/* Detected area chip */}
      {detected && (
        <div className="flex items-center gap-2 rounded-base bg-primary-soft px-3 py-2 text-sm dark:bg-primary/10">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" /></svg>
          </span>
          <span className="text-slate">{t('detectedArea')} <span className="font-semibold text-ink dark:text-gray-100">{detected.town.name}</span></span>
        </div>
      )}
      <p className="text-xs text-slate">{t('mapHint')}</p>

      {/* Address detail — the "find me" info a provider actually needs */}
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink dark:text-gray-200">{t('addressNotes')}</span>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); emit({ addressNotes: e.target.value }); }}
          rows={2}
          placeholder={t('addressNotesHint')}
          className="w-full rounded-base border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </label>
    </div>
  );
}

export { KANDY };
