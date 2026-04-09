'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { trips as tripsApi, type TripLocation } from '@/lib/api';
import { X, Navigation, Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  tripId: string;
  onClose: () => void;
}

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

export function LiveMapModal({ tripId, onClose }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const driverMarkerRef = useRef<unknown>(null);
  const [locationData, setLocationData] = useState<TripLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const POLL_INTERVAL_MS = 10_000;

  const fetchLocation = useCallback(async () => {
    try {
      const res = await tripsApi.getLocation(tripId);
      if (res.success && res.data) {
        setLocationData(res.data);
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch location');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Bootstrap Leaflet (OSM — zero API key required)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchLocation]);

  // Init map after first data arrives
  useEffect(() => {
    if (!locationData || !mapContainerRef.current) return;
    const Leaflet = () => import('leaflet').then((L) => L.default);

    Leaflet().then((L) => {
      if (mapRef.current) return; // Already initialized

      const defaultCenter: [number, number] = [20.5937, 78.9629]; // India centre fallback
      const hasDriver = locationData.lastKnownLat != null && locationData.lastKnownLng != null;
      const hasPickup = locationData.pickupLocation?.lat != null;
      const center: [number, number] = hasDriver
        ? [locationData.lastKnownLat!, locationData.lastKnownLng!]
        : hasPickup
          ? [locationData.pickupLocation!.lat!, locationData.pickupLocation!.lng!]
          : defaultCenter;

      const map = L.map(mapContainerRef.current!, { zoomControl: true }).setView(center, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Pickup marker (green)
      if (locationData.pickupLocation?.lat != null) {
        const icon = L.divIcon({ className: '', html: '<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px #22c55e80"></div>', iconSize: [14, 14] }) as any;
        L.marker([locationData.pickupLocation.lat, locationData.pickupLocation.lng!], { icon })
          .addTo(map)
          .bindPopup(`<b>Pickup</b><br/>${locationData.pickupLocation.address || ''}`);
      }

      // Drop marker (red)
      if (locationData.dropLocation?.lat != null) {
        const icon = L.divIcon({ className: '', html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px #ef444480"></div>', iconSize: [14, 14] }) as any;
        L.marker([locationData.dropLocation.lat!, locationData.dropLocation.lng!], { icon })
          .addTo(map)
          .bindPopup(`<b>Drop-off</b><br/>${locationData.dropLocation.address || ''}`);
      }

      // Driver marker (blue pulsing)
      if (hasDriver) {
        const driverIcon = L.divIcon({
          className: '',
          html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
                   <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:#3b82f680;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
                   <div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 0 8px #3b82f6;position:relative;z-index:1;"></div>
                 </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }) as any;
        const marker = L.marker([locationData.lastKnownLat!, locationData.lastKnownLng!], { icon: driverIcon })
          .addTo(map)
          .bindPopup('<b>Driver (Live)</b>');
        (driverMarkerRef as React.MutableRefObject<unknown>).current = marker;
      }
    });
  }, [locationData]);

  // Update driver marker position on subsequent polls
  useEffect(() => {
    if (!driverMarkerRef.current || !locationData?.lastKnownLat) return;
    import('leaflet').then((L) => {
      const marker = driverMarkerRef.current as ReturnType<typeof L.default.marker>;
      marker.setLatLng([locationData.lastKnownLat!, locationData.lastKnownLng!]);
    });
  }, [locationData?.lastKnownLat, locationData?.lastKnownLng]);

  const statusColor = locationData?.driverResponse === 'Accepted' ? 'text-green-400' : 'text-yellow-400';
  const statusLabel = locationData?.driverResponse === 'Accepted' ? 'Driver Tracking Active' : `Driver: ${locationData?.driverResponse ?? '…'}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex h-[88vh] w-full max-w-3xl flex-col rounded-2xl bg-[#0f172a] border border-white/10 overflow-hidden shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0">
          <div>
            <h2 className="font-semibold text-white text-base">Live Driver Location</h2>
            <div className="mt-0.5 flex items-center gap-2">
              {locationData?.lastKnownLat != null && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
              )}
              <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
              {locationData?.lastLocationAt && (
                <span className="text-xs text-slate-500">
                  · Last update: {new Date(locationData.lastLocationAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info bar */}
        <div className="flex items-center gap-4 bg-white/5 px-5 py-2.5 text-xs text-slate-400 shrink-0">
          {locationData?.pickupLocation?.address && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
              <span className="truncate max-w-[200px]">{locationData.pickupLocation.address}</span>
            </span>
          )}
          {locationData?.dropLocation?.address && (
            <>
              <span className="text-slate-600">→</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                <span className="truncate max-w-[200px]">{locationData.dropLocation.address}</span>
              </span>
            </>
          )}
        </div>

        {/* Map area */}
        <div className="relative flex-1">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f172a]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0f172a] text-slate-400">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!loading && !error && locationData?.lastKnownLat == null && locationData?.driverResponse === 'Accepted' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0f172a]/80 text-slate-400">
              <Navigation className="h-8 w-8 text-blue-400 animate-pulse" />
              <p className="text-sm">Waiting for driver&apos;s first location ping…</p>
            </div>
          )}
          {!loading && !error && locationData?.driverResponse !== 'Accepted' && locationData?.driverResponse !== undefined && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0f172a] text-slate-400">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
              <p className="text-sm">Driver has not yet accepted the trip. No location available.</p>
            </div>
          )}
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        {/* Add Leaflet ping animation */}
        <style>{`@keyframes ping { 75%,100%{transform:scale(2);opacity:0} }`}</style>
      </div>
    </div>
  );
}
