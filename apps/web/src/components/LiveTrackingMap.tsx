'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import 'leaflet/dist/leaflet.css';

/**
 * Live job-tracking map (customer view). Shows the provider's latest reported
 * position (moving) + the service destination, a line between them, and an ETA
 * banner. This is the "Uber driver approaching" moment — the signature premium
 * feel for a services app. Read-only; the parent polls the booking + passes props.
 */
export function LiveTrackingMap({
  provider,
  destination,
  etaMinutes,
  updatedAt,
}: {
  provider: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number };
  etaMinutes?: number | null;
  updatedAt?: string | null;
}) {
  const t = useTranslations('track');
  const el = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!el.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current) return;
      const map = L.map(el.current, { attributionControl: true, zoomControl: false }).setView([destination.lat, destination.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setTimeout(() => map.invalidateSize(), 200);
      draw(L);
    })();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => { if (!mapRef.current) return; const L = (await import('leaflet')).default; draw(L); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.lat, provider?.lng, destination.lat, destination.lng]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function draw(L: any) {
    const layer = layerRef.current, map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    // Destination (the customer) — indigo pin.
    const destIcon = L.divIcon({ className: '', html: '<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#4F46E5;border:3px solid #fff;box-shadow:0 2px 6px rgba(11,13,18,.4);transform:rotate(-45deg)"></div>', iconSize: [24, 24], iconAnchor: [12, 22] });
    L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(layer);

    if (provider) {
      // Provider — a green pulsing dot ("on the move").
      const provIcon = L.divIcon({ className: '', html: '<div style="width:18px;height:18px;border-radius:50%;background:#16A34A;border:3px solid #fff;box-shadow:0 0 0 6px rgba(22,163,74,.18)"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
      L.marker([provider.lat, provider.lng], { icon: provIcon }).addTo(layer);
      L.polyline([[provider.lat, provider.lng], [destination.lat, destination.lng]], { color: '#4F46E5', weight: 2, dashArray: '5 6', opacity: 0.6 }).addTo(layer);
      map.fitBounds([[provider.lat, provider.lng], [destination.lat, destination.lng]], { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([destination.lat, destination.lng], 14);
    }
  }

  const stale = updatedAt ? (Date.now() - new Date(updatedAt).getTime()) > 120000 : true;

  return (
    <div className="overflow-hidden rounded-xl2 border border-line dark:border-gray-800">
      {/* ETA / status banner */}
      <div className="flex items-center gap-2.5 bg-ink px-4 py-3 text-white">
        <span className="relative flex h-2.5 w-2.5">
          {provider && !stale && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${provider && !stale ? 'bg-success' : 'bg-slate-2'}`} />
        </span>
        <span className="text-sm font-semibold">
          {!provider ? t('waitingForLocation')
            : etaMinutes != null ? t('etaMinutes', { min: etaMinutes })
            : t('onTheWay')}
        </span>
        {provider && stale && <span className="ml-auto text-xs text-white/60">{t('lastSeen')}</span>}
      </div>
      <div ref={el} className="h-56 w-full" style={{ zIndex: 0 }} />
    </div>
  );
}
