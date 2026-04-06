'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fuelLogs as fuelLogsApi, trips as tripsApi, type FuelLog, type Trip } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';
import { Fuel, TrendingDown } from 'lucide-react';

export default function FuelReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== ROLES.FinancialAnalyst) {
      router.replace('/dashboard/access-denied');
      return;
    }
    Promise.all([
      fuelLogsApi.list().then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
      tripsApi.list('Completed').then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
    ]).then(([f, t]) => {
      setFuelLogs(f);
      setTrips(t);
    }).finally(() => setLoading(false));
  }, [user?.role, router]);

  const totalLiters = fuelLogs.reduce((s, f) => s + (f.liters || 0), 0);
  const totalCost = fuelLogs.reduce((s, f) => s + (f.cost || 0), 0);
  const tripDistance = trips.reduce((s, t) => s + (t.distance || 0), 0);
  const tripFuel = trips.reduce((s, t) => s + (t.fuelUsed || 0), 0);
  const fleetEfficiency = tripFuel > 0 ? (tripDistance / tripFuel).toFixed(2) : '–';

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#F1F5F9]" />
      </div>
    );
  }

  if (user?.role !== ROLES.FinancialAnalyst) return null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold neon-text">Fuel Reports</h1>
        <p className="mt-1 text-[#64748B]">View liters, cost, and Fuel Efficiency (km/L)</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
          <p className="text-xs text-[#64748B]">Total liters</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Fuel className="h-5 w-5 text-[#2563EB]" /> {totalLiters.toFixed(1)} L
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
          <p className="text-xs text-[#64748B]">Total cost</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">${totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
          <p className="text-xs text-[#64748B]">Fleet Fuel Efficiency</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-[#2563EB]" /> {fleetEfficiency} km/L
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]/50 bg-white/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Liters</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Cost</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Date</th>
            </tr>
          </thead>
          <tbody>
            {fuelLogs.map((f) => (
              <tr key={f._id} className="border-b border-zinc-800/50">
                <td className="px-4 py-3 text-[#0F172A]">{typeof f.vehicleId === 'object' && f.vehicleId?.name ? (f.vehicleId as { name: string }).name : '-'}</td>
                <td className="px-4 py-3 text-[#475569]">{f.liters}</td>
                <td className="px-4 py-3 text-[#475569]">${f.cost?.toLocaleString()}</td>
                <td className="px-4 py-3 text-[#64748B]">{f.date ? new Date(f.date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {fuelLogs.length === 0 && <div className="py-12 text-center text-[#64748B]">No fuel logs</div>}
      </div>
    </div>
  );
}
