'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { vehicles as vehiclesApi, gemini, maintenance as maintenanceApi, type Vehicle, type Maintenance } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';
import { ArrowLeft, Sparkles, Wrench, Edit2 } from 'lucide-react';

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [aiRisk, setAiRisk] = useState<{ riskScore: number; suggestion: string; financialImpact: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [odometerInput, setOdometerInput] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', licensePlate: '', capacity: 0, acquisitionCost: 0, fuelEfficiency: 0 });

  const canEdit = can(user?.role, Permissions.VEHICLES.edit);

  const load = () => {
    if (!id) return;
    Promise.all([
      vehiclesApi.get(id).then((r) => r.data as Vehicle | undefined),
      maintenanceApi.list(id).then((r) => (Array.isArray(r.data) ? r.data : []) as Maintenance[]),
      gemini.vehicleRisk(id).then((r) => r.data).catch(() => null),
    ]).then(([v, m, ai]) => {
      setVehicle(v ?? null);
      setMaintenances(m ?? []);
      setAiRisk(ai ?? null);
      if (v) {
        setOdometerInput(String(v.odometer ?? 0));
        setEditForm({
          name: v.name,
          licensePlate: v.licensePlate,
          capacity: v.capacity,
          acquisitionCost: v.acquisitionCost,
          fuelEfficiency: v.fuelEfficiency ?? 0,
        });
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
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

  const handleOdometerSave = async () => {
    const val = Number(odometerInput);
    if (isNaN(val) || val < 0) return;
    try {
      await vehiclesApi.update(id, { odometer: val });
      setVehicle((v) => (v ? { ...v, odometer: val } : null));
    } catch {
      alert('Failed to update odometer');
    }
  };

  const handleStatusChange = async (status: string) => {
    setStatusUpdating(true);
    try {
      await vehiclesApi.update(id, { status });
      setVehicle((v) => (v ? { ...v, status } : null));
    } catch {
      alert('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehiclesApi.update(id, editForm);
      setShowEditModal(false);
      load();
    } catch {
      alert('Failed to update vehicle');
    }
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
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            </div>
          )}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-zinc-500">Capacity (kg)</p><p className="font-medium text-white">{vehicle.capacity}</p></div>
          <div>
            <p className="text-xs text-zinc-500">Odometer</p>
            {canEdit ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={odometerInput}
                  onChange={(e) => setOdometerInput(e.target.value)}
                  onBlur={handleOdometerSave}
                  className="w-28 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-white"
                />
              </div>
            ) : (
              <p className="font-medium text-white">{vehicle.odometer?.toLocaleString() ?? '-'}</p>
            )}
          </div>
          <div><p className="text-xs text-zinc-500">Acquisition Cost</p><p className="font-medium text-white">${vehicle.acquisitionCost?.toLocaleString() ?? '-'}</p></div>
          <div><p className="text-xs text-zinc-500">Fuel efficiency (km/L)</p><p className="font-medium text-white">{vehicle.fuelEfficiency ?? '-'}</p></div>
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            {canEdit && vehicle.status !== 'On Trip' ? (
              <select
                value={vehicle.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-white"
              >
                <option value="Available">Available</option>
                <option value="In Shop">Out of Service (In Shop)</option>
                <option value="Retired">Retired</option>
              </select>
            ) : (
              <p className="font-medium text-white">{vehicle.status}</p>
            )}
          </div>
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

      {showEditModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass neon-border w-full max-w-md rounded-xl p-6">
            <h3 className="font-semibold text-white">Edit Vehicle</h3>
            <form onSubmit={handleEditSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-zinc-400">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-white" required />
              </div>
              <div>
                <label className="block text-sm text-zinc-400">License Plate</label>
                <input value={editForm.licensePlate} onChange={(e) => setEditForm((f) => ({ ...f, licensePlate: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400">Capacity (kg)</label>
                  <input type="number" min={0} value={editForm.capacity} onChange={(e) => setEditForm((f) => ({ ...f, capacity: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">Acquisition Cost</label>
                  <input type="number" min={0} value={editForm.acquisitionCost} onChange={(e) => setEditForm((f) => ({ ...f, acquisitionCost: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400">Fuel efficiency (km/L)</label>
                <input type="number" min={0} step={0.1} value={editForm.fuelEfficiency} onChange={(e) => setEditForm((f) => ({ ...f, fuelEfficiency: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-white" />
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 rounded-lg border border-zinc-600 py-2 text-zinc-300">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-[#00ffc8]/20 py-2 text-[#00ffc8] hover:bg-[#00ffc8]/30">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
