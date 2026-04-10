'use client';

import { useEffect, useState } from 'react';
import { trips as tripsApi, type Trip } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';
import { Fuel, TrendingDown } from 'lucide-react';

export default function FuelLogsPage() {
  const { user } = useAuth();
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const canView = can(user?.role, Permissions.FUEL_LOGS.view);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    tripsApi
      .list('Completed')
      .then((r) => {
        if (r.success && r.data) setCompletedTrips(Array.isArray(r.data) ? r.data : []);
      })
      .finally(() => setLoading(false));
  }, [canView]);

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
          <p className="mt-1 text-sm">You do not have permission to view fuel & expense logs.</p>
        </div>
      </div>
    );
  }

  const totalFuel = completedTrips.reduce((sum, t) => sum + (t.fuelUsed || 0), 0);
  const totalFuelCost = completedTrips.reduce((sum, t) => sum + (t.cost || 0), 0);
  const avgEfficiency = completedTrips.length > 0 ? (completedTrips.reduce((sum, t) => sum + (t.distance || 0), 0) / totalFuel).toFixed(2) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold neon-text">Fuel & Expense Tracking</h1>
        <p className="mt-1 text-sm text-[#64748B]">Monitor fuel consumption and operational costs</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
          <p className="text-xs text-[#64748B]">Total Fuel Used</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Fuel className="h-5 w-5 text-[#2563EB]" /> {totalFuel.toFixed(1)} L
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
          <p className="text-xs text-[#64748B]">Total Fuel Cost</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">${totalFuelCost.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
          <p className="text-xs text-[#64748B]">Avg. Efficiency</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-[#2563EB]" /> {avgEfficiency} km/L
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]/50 bg-white/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Driver</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Distance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Fuel Used</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Fuel Cost</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Efficiency</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">End Date</th>
            </tr>
          </thead>
          <tbody>
            {completedTrips.map((t) => {
              const efficiency = (t.fuelUsed && t.distance) ? (t.distance / t.fuelUsed).toFixed(2) : 0;
              return (
                <tr key={t._id} className="border-b border-zinc-800/50 hover:bg-[#F1F5F9]/30">
                  <td className="px-4 py-3 text-[#0F172A]">{(t.vehicleId as { name?: string })?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-[#475569]">{(t.driverId as { name?: string })?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-[#475569]">{t.distance} km</td>
                  <td className="px-4 py-3 text-[#475569]">{t.fuelUsed ?? '-'} L</td>
                  <td className="px-4 py-3 text-[#475569]">${t.cost ?? 0}</td>
                  <td className="px-4 py-3 text-[#2563EB]">{efficiency} km/L</td>
                  <td className="px-4 py-3 text-[#64748B]">{t.endTime ? new Date(t.endTime).toLocaleDateString() : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {completedTrips.length === 0 && <div className="py-12 text-center text-[#64748B]">No fuel logs available</div>}
      </div>
    </div>
  );
}
