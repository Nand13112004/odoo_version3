'use client';

import { useEffect, useState } from 'react';
import { trips as tripsApi, type Trip } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';

export default function CompletedTripsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const canView = can(user?.role, Permissions.NAV.completed);

  useEffect(() => {
    tripsApi.list('Completed').then((r) => {
      if (r.success && r.data) setList(Array.isArray(r.data) ? r.data : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#F1F5F9]" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center text-red-400">
          <p className="font-medium">Access Denied</p>
          <p className="mt-1 text-sm">You do not have permission to view completed trips.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold neon-text">Completed Trips</h1>
      <p className="mt-1 text-[#64748B]">History of completed deliveries</p>
      <div className="mt-6 bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]/50 bg-white/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Driver</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Distance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Revenue</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">End</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t._id} className="border-b border-zinc-800/50 hover:bg-[#F1F5F9]/30">
                <td className="px-4 py-3 text-[#0F172A]">{(t.vehicleId as { name?: string })?.name ?? '-'}</td>
                <td className="px-4 py-3 text-[#475569]">{(t.driverId as { name?: string })?.name ?? '-'}</td>
                <td className="px-4 py-3 text-[#475569]">{t.distance} km</td>
                <td className="px-4 py-3 text-[#475569]">${t.revenue ?? 0}</td>
                <td className="px-4 py-3 text-[#475569]">
                  {t.locationUrl ? (
                    <a
                      href={t.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline"
                    >
                      Open map
                    </a>
                  ) : (
                    <span className="text-[#64748B]">–</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#64748B]">{t.endTime ? new Date(t.endTime).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="py-12 text-center text-[#64748B]">No completed trips</div>}
      </div>
    </div>
  );
}
