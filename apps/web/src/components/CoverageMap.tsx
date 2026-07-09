'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { TOWNS } from '@/lib/towns';

/**
 * Read-only coverage preview for the provider service-area picker. Draws an indigo
 * marker + radius circle for each selected town so the provider can SEE the area
 * they'll be matched in — not just a list of chips. Fits the map to the selection.
 */
export function CoverageMap({ selectedKeys, radiusMeters }: { selectedKeys: Set<string>; radiusMeters: number }) {
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
      const map = L.map(el.current, { attributionControl: true, zoomControl: false, scrollWheelZoom: false }).setView([7.2906, 80.635], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setTimeout(() => map.invalidateSize(), 200);
      draw(L);
    })();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw circles when the selection or radius changes.
  useEffect(() => {
    (async () => {
      if (!mapRef.current) return;
      const L = (await import('leaflet')).default;
      draw(L);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeys, radiusMeters]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function draw(L: any) {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    const chosen = TOWNS.filter((tn) => selectedKeys.has(tn.key));
    if (chosen.length === 0) return;
    const pin = L.divIcon({
      className: '',
      html: '<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#4F46E5;border:2px solid #fff;box-shadow:0 1px 3px rgba(11,13,18,.4);transform:rotate(-45deg)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 16],
    });
    const bounds: [number, number][] = [];
    for (const tn of chosen) {
      L.circle([tn.lat, tn.lng], { radius: radiusMeters, color: '#4F46E5', weight: 1.5, fillColor: '#4F46E5', fillOpacity: 0.12 }).addTo(layer);
      L.marker([tn.lat, tn.lng], { icon: pin }).addTo(layer);
      bounds.push([tn.lat, tn.lng]);
    }
    if (bounds.length === 1) map.setView(bounds[0], 11);
    else map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }

  return <div ref={el} className="h-52 w-full overflow-hidden rounded-xl2 border border-line dark:border-gray-800" style={{ zIndex: 0 }} />;
}
