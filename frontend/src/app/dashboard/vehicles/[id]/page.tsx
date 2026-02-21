'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { vehicles as vehiclesApi, gemini, maintenance as maintenanceApi, type Vehicle, type Maintenance } from '@/lib/api';
import { ArrowLeft, Sparkles, Wrench } from 'lucide-react';

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [aiRisk, setAiRisk] = useState<{ riskScore: number; suggestion: string; financialImpact: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      vehiclesApi.get(id).then((r) => r.data as Vehicle | undefined),
      maintenanceApi.list(id).then((r) => (Array.isArray(r.data) ? r.data : []) as Maintenance[]),
      gemini.vehicleRisk(id).then((r) => r.data).catch(() => null),
    ]).then(([v, m, ai]) => {
      setVehicle(v ?? null);
      setMaintenances(m ?? []);
      setAiRisk(ai ?? null);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading || !vehicle) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-zinc-800/50" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Available: 'bg-emerald-500/20 text-emerald-400',
    'On Trip': 'bg-blue-500/20 text-blue-400',
    'In Shop': 'bg-amber-500/20 text-amber-400',
    Retired: 'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <div className="p-8">
      <Link href="/dashboard/vehicles" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#00ffc8]">
        <ArrowLeft className="h-4 w-4" /> Back to registry
      </Link>
      <div className="glass neon-border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{vehicle.name}</h1>
            <p className="mt-1 text-zinc-400">{vehicle.licensePlate}</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm ${statusColors[vehicle.status] || ''}`}>
              {vehicle.status}
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-zinc-500">Capacity (kg)</p><p className="font-medium text-white">{vehicle.capacity}</p></div>
          <div><p className="text-xs text-zinc-500">Odometer</p><p className="font-medium text-white">{vehicle.odometer?.toLocaleString() ?? '-'}</p></div>
          <div><p className="text-xs text-zinc-500">Acquisition Cost</p><p className="font-medium text-white">${vehicle.acquisitionCost?.toLocaleString() ?? '-'}</p></div>
          <div><p className="text-xs text-zinc-500">Fuel efficiency (km/L)</p><p className="font-medium text-white">{vehicle.fuelEfficiency ?? '-'}</p></div>
          <div><p className="text-xs text-zinc-500">Risk Score</p><p className="font-medium text-white">{vehicle.riskScore ?? 0}</p></div>
          <div><p className="text-xs text-zinc-500">Total Revenue</p><p className="font-medium text-white">${vehicle.totalRevenue?.toLocaleString() ?? '0'}</p></div>
          <div><p className="text-xs text-zinc-500">Total Maintenance</p><p className="font-medium text-white">${vehicle.totalMaintenanceCost?.toLocaleString() ?? '0'}</p></div>
          <div><p className="text-xs text-zinc-500">ROI</p><p className="font-medium text-[#00ffc8]">{vehicle.roi != null ? `${vehicle.roi.toFixed(1)}%` : '-'}</p></div>
        </div>
        {aiRisk && (
          <div className="mt-6 rounded-lg border border-[#00ffc8]/20 bg-[#00ffc8]/5 p-4">
            <div className="flex items-center gap-2 text-[#00ffc8]">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">AI Analysis</span>
            </div>
            <p className="mt-2 text-sm text-zinc-300">{aiRisk.suggestion}</p>
            <p className="mt-1 text-sm text-zinc-400">{aiRisk.financialImpact}</p>
          </div>
        )}
        <div className="mt-6">
          <h2 className="flex items-center gap-2 font-semibold text-white"><Wrench className="h-4 w-4" /> Maintenance history</h2>
          <ul className="mt-3 space-y-2">
            {maintenances.slice(0, 10).map((m) => (
              <li key={m._id} className="flex justify-between rounded bg-zinc-800/50 px-3 py-2 text-sm">
                <span className="text-zinc-300">{(m.vehicleId as { name?: string })?.name ?? ''} - {m.description}</span>
                <span className="text-zinc-400">${m.cost} - {new Date(m.date).toLocaleDateString()}</span>
              </li>
            ))}
            {maintenances.length === 0 && <p className="text-sm text-zinc-500">No maintenance records</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
