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
        <div className="h-64 animate-pulse rounded-xl bg-[#E2E8F0]" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Available: 'bg-[#10B981]/10 text-[#10B981]',
    'On Trip': 'bg-[#2563EB]/10 text-[#2563EB]',
    'In Shop': 'bg-[#F59E0B]/10 text-[#F59E0B]',
    Retired: 'bg-[#64748B]/10 text-[#64748B]',
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
      <Link href="/dashboard/vehicles" className="mb-6 inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#2563EB] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to registry
      </Link>
      <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] font-headline">{vehicle.name}</h1>
            <p className="mt-1 text-[#64748B]">{vehicle.licensePlate}</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${statusColors[vehicle.status] || ''}`}>
              {vehicle.status}
            </span>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            </div>
          )}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Capacity (kg)</p><p className="font-semibold text-[#0F172A] mt-1">{vehicle.capacity}</p></div>
          <div>
            <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Odometer</p>
            {canEdit ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={0}
                  value={odometerInput}
                  onChange={(e) => setOdometerInput(e.target.value)}
                  onBlur={handleOdometerSave}
                  className="w-28 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            ) : (
              <p className="font-semibold text-[#0F172A] mt-1">{vehicle.odometer?.toLocaleString() ?? '-'}</p>
            )}
          </div>
          <div><p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Acquisition Cost</p><p className="font-semibold text-[#0F172A] mt-1">${vehicle.acquisitionCost?.toLocaleString() ?? '-'}</p></div>
          <div><p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Fuel efficiency (km/L)</p><p className="font-semibold text-[#0F172A] mt-1">{vehicle.fuelEfficiency ?? '-'}</p></div>
          <div>
            <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Status</p>
            {canEdit && vehicle.status !== 'On Trip' ? (
              <select
                value={vehicle.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="mt-1 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="Available">Available</option>
                <option value="In Shop">Out of Service (In Shop)</option>
                <option value="Retired">Retired</option>
              </select>
            ) : (
              <p className="font-semibold text-[#0F172A] mt-1">{vehicle.status}</p>
            )}
          </div>
          <div><p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Risk Score</p><p className="font-semibold text-[#0F172A] mt-1">{vehicle.riskScore ?? 0}</p></div>
          <div><p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Total Revenue</p><p className="font-semibold text-[#0F172A] mt-1">${vehicle.totalRevenue?.toLocaleString() ?? '0'}</p></div>
          <div><p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Total Maintenance</p><p className="font-semibold text-[#0F172A] mt-1">${vehicle.totalMaintenanceCost?.toLocaleString() ?? '0'}</p></div>
          <div><p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">ROI</p><p className="font-semibold text-[#2563EB] mt-1">{vehicle.roi != null ? `${vehicle.roi.toFixed(1)}%` : '-'}</p></div>
        </div>
        {aiRisk && (
          <div className="mt-6 rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/5 p-4">
            <div className="flex items-center gap-2 text-[#2563EB]">
              <Sparkles className="h-4 w-4" />
              <span className="font-bold text-sm">AI Analysis</span>
            </div>
            <p className="mt-2 text-sm text-[#475569]">{aiRisk.suggestion}</p>
            <p className="mt-1 text-sm text-[#64748B]">{aiRisk.financialImpact}</p>
          </div>
        )}
        <div className="mt-6">
          <h2 className="flex items-center gap-2 font-semibold text-[#0F172A] font-headline"><Wrench className="h-4 w-4" /> Maintenance history</h2>
          <ul className="mt-3 space-y-2">
            {maintenances.slice(0, 10).map((m) => (
              <li key={m._id} className="flex justify-between rounded-lg bg-[#F1F5F9] px-3 py-2 text-sm">
                <span className="text-[#475569]">{(m.vehicleId as { name?: string })?.name ?? ''} - {m.description}</span>
                <span className="text-[#64748B]">${m.cost} - {new Date(m.date).toLocaleDateString()}</span>
              </li>
            ))}
            {maintenances.length === 0 && <p className="text-sm text-[#64748B]">No maintenance records</p>}
          </ul>
        </div>
      </div>

      {showEditModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] shadow-[0_20px_50px_rgba(15,23,42,0.12)] w-full max-w-md rounded-xl p-6">
            <h3 className="font-bold text-[#0F172A] font-headline">Edit Vehicle</h3>
            <form onSubmit={handleEditSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B]">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B]">License Plate</label>
                <input value={editForm.licensePlate} onChange={(e) => setEditForm((f) => ({ ...f, licensePlate: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B]">Capacity (kg)</label>
                  <input type="number" min={0} value={editForm.capacity} onChange={(e) => setEditForm((f) => ({ ...f, capacity: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B]">Acquisition Cost</label>
                  <input type="number" min={0} value={editForm.acquisitionCost} onChange={(e) => setEditForm((f) => ({ ...f, acquisitionCost: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B]">Fuel efficiency (km/L)</label>
                <input type="number" min={0} step={0.1} value={editForm.fuelEfficiency} onChange={(e) => setEditForm((f) => ({ ...f, fuelEfficiency: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5" />
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 rounded-lg border border-[#E2E8F0] py-2.5 text-[#64748B] font-medium hover:bg-[#F1F5F9] transition-all">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-[#2563EB] py-2.5 font-bold text-[#0F172A] hover:bg-[#1D4ED8] shadow-btn-primary transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
