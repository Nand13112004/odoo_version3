'use client';

import { useEffect, useState } from 'react';
import { vehicles as vehiclesApi, trips as tripsApi, type Vehicle, type Trip } from '@/lib/api';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

export default function LiveMapPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      vehiclesApi.list().then((r) => (Array.isArray(r.data) ? r.data : []) as Vehicle[]),
      tripsApi.list('Dispatched').then((r) => (Array.isArray(r.data) ? r.data : []) as Trip[]),
    ])
      .then(([v, t]) => {
        setVehicles(v);
        setActiveTrips(t);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold neon-text">Live Map</h1>
      <p className="mt-1 text-[#64748B]">Fleet locations (Leaflet — no API key required)</p>
      <div className="mt-6 h-[400px] sm:h-[500px] md:h-[600px] w-full overflow-hidden rounded-xl bg-white border border-[#E2E8F0] shadow-card">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
          </div>
        ) : (
          <LeafletMap vehicles={vehicles} />
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {vehicles.filter((v) => v.status === 'On Trip').map((v) => (
          <span key={v._id} className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300">
            {v.name} - On Trip
          </span>
        ))}
      </div>
      {activeTrips.length > 0 && (
        <div className="mt-6 bg-white border border-[#E2E8F0] shadow-card rounded-xl p-4">
          <h2 className="mb-3 text-sm font-semibold text-[#0F172A]">Dispatcher shared locations</h2>
          <div className="flex flex-wrap gap-2">
            {activeTrips
              .filter((t) => t.locationUrl)
              .map((t) => (
                <a
                  key={t._id}
                  href={t.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/25"
                >
                  {(t.vehicleId as { name?: string })?.name ?? 'Trip'} → Google Maps
                </a>
              ))}
            {activeTrips.filter((t) => t.locationUrl).length === 0 && (
              <p className="text-xs text-[#64748B]">No shared map links from dispatcher yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
