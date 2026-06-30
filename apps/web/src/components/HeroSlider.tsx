'use client';

import { useEffect, useState } from 'react';

/**
 * Landing hero image slider — a browser-mockup frame with auto-rotating
 * home-service photos (free Unsplash). Plain <img> (not next/image) so no host
 * config is needed; lazy + async decode keeps it light.
 */
const SLIDES = [
  { src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=70', alt: 'Professional cleaning a bright modern home' },
  { src: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=70', alt: 'Electrician working on a panel' },
  { src: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1200&q=70', alt: 'Plumber fixing a kitchen sink' },
  { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=70', alt: 'Bright, freshly serviced living room' },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-lift dark:border-gray-800 dark:bg-gray-900">
      {/* Browser-mockup chrome */}
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        </span>
        <span className="ml-2 truncate text-xs font-medium text-slate">skilllink.lk</span>
      </div>

      {/* Slides */}
      <div className="relative aspect-[16/10] w-full bg-surface dark:bg-gray-800">
        {SLIDES.map((s, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            loading={n === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${n === i ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {SLIDES.map((_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show slide ${n + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
