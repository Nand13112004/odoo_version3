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
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-zinc-800/50" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-8">
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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold neon-text">Fuel & Expense Tracking</h1>
        <p className="mt-1 text-sm text-zinc-400">Monitor fuel consumption and operational costs</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="glass neon-border rounded-lg p-4">
          <p className="text-xs text-zinc-400">Total Fuel Used</p>
          <p className="mt-2 text-2xl font-bold text-white flex items-center gap-2">
            <Fuel className="h-5 w-5 text-[#00ffc8]" /> {totalFuel.toFixed(1)} L
          </p>
        </div>
        <div className="glass neon-border rounded-lg p-4">
          <p className="text-xs text-zinc-400">Total Fuel Cost</p>
          <p className="mt-2 text-2xl font-bold text-white">${totalFuelCost.toLocaleString()}</p>
        </div>
        <div className="glass neon-border rounded-lg p-4">
          <p className="text-xs text-zinc-400">Avg. Efficiency</p>
          <p className="mt-2 text-2xl font-bold text-white flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-[#00ffc8]" /> {avgEfficiency} km/L
          </p>
        </div>
      </div>

      <div className="glass neon-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-900/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Driver</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Distance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Fuel Used</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Fuel Cost</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Efficiency</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">End Date</th>
            </tr>
          </thead>
          <tbody>
            {completedTrips.map((t) => {
              const efficiency = (t.fuelUsed && t.distance) ? (t.distance / t.fuelUsed).toFixed(2) : 0;
              return (
                <tr key={t._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-white">{(t.vehicleId as { name?: string })?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-zinc-300">{(t.driverId as { name?: string })?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-zinc-300">{t.distance} km</td>
                  <td className="px-4 py-3 text-zinc-300">{t.fuelUsed ?? '-'} L</td>
                  <td className="px-4 py-3 text-zinc-300">${t.cost ?? 0}</td>
                  <td className="px-4 py-3 text-[#00ffc8]">{efficiency} km/L</td>
                  <td className="px-4 py-3 text-zinc-400">{t.endTime ? new Date(t.endTime).toLocaleDateString() : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {completedTrips.length === 0 && <div className="py-12 text-center text-zinc-500">No fuel logs available</div>}
      </div>
    </div>
  );
}
