'use client';

import { useRef, useEffect, useState } from 'react';
import type { Vehicle } from '@/lib/api';

declare global {
  interface Window {
    mapboxgl: typeof import('mapbox-gl');
  }
}

export default function MapboxMap({ vehicles }: { vehicles: Vehicle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setLoaded(true);
      return;
    }
    import('mapbox-gl/dist/mapbox-gl.css');
    import('mapbox-gl').then((mapboxgl) => {
      mapboxgl.default.accessToken = token;
      const map = new mapboxgl.default.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-98, 39],
        zoom: 3,
      });
      map.on('load', () => setLoaded(true));
      return () => map.remove();
    }).catch(() => setLoaded(true));
  }, []);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900/50 text-zinc-400">
        Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local for live map.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}
