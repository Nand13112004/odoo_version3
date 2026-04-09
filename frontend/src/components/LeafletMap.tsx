'use client';

import { useEffect, useRef, useState } from 'react';
import type { Vehicle } from '@/lib/api';

export default function LeafletMap({ vehicles }: { vehicles: Vehicle[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (mapRef.current) return;

      const map = L.map(mapContainerRef.current!).setView([20.5937, 78.9629], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;

      // Add markers for vehicles
      vehicles.forEach((v) => {
        // Since we don't have real-time GPS for all vehicles yet (only for active trips),
        // we'll place them randomly or at a default spot if no coords.
        // For this demo, let's just show them if they have coords or skip.
        // Actually, let's just add markers at fixed points for demo if status is 'On Trip'
        if (v.status === 'On Trip') {
          const lat = 20.5937 + (Math.random() - 0.5) * 10;
          const lng = 78.9629 + (Math.random() - 0.5) * 10;
          L.marker([lat, lng], {
            icon: L.divIcon({
              className: '',
              html: `<div style="background:#2563EB;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px #2563EB80"></div>`,
              iconSize: [12, 12],
            }) as any
          }).addTo(map).bindPopup(`<b>${v.name}</b><br/>Status: ${v.status}<br/>Plate: ${v.licensePlate}`);
        }
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [vehicles]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
