/** Shared category glyphs — one source for the landing grid and the /book browser. */
const PATHS: Record<string, string> = {
  electrician: 'M13 2L3 14h7l-1 8 10-12h-7z',
  plumber: 'M9 3v6a3 3 0 003 3 3 3 0 003-3V3M7 21h10M12 12v9',
  ac_tech: 'M3 7h18M3 12h18M3 17h18',
  welder: 'M12 2l2 7h7l-6 4 2 7-5-4-5 4 2-7-6-4h7z',
  carpenter: 'M2 20l6-6M14 4l6 6-9 9-6-6z',
  mechanic: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 01-1 3l2 2-2 2-2-2a7 7 0 01-3 1l-1 2-2-2',
  painter: 'M5 3h14v6H5zM9 9v3a3 3 0 003 3v6',
  mason: 'M3 8h7v4H3zM14 8h7v4h-7zM7 14h10v4H7z',
  cctv: 'M2 7l16-4 2 6-16 4zM6 13v6M12 11l3 8',
  cleaning: 'M19 3l-7 7M5 21l4-10 5 5-10 4zM14 8l2-2',
  solar: 'M4 14h16l-2-9H6zM2 18h20M9 5v9M15 5v9',
  auto_ac: 'M5 11l2-5h10l2 5M5 11h14v5H5zM7 16v2M17 16v2',
};

export function CategoryIcon({ keyName, className = 'h-5 w-5' }: { keyName: string; className?: string }) {
  const match = Object.keys(PATHS).find((k) => keyName.startsWith(k));
  const d = PATHS[match ?? ''] ?? 'M4 6h16M4 12h16M4 18h10';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
