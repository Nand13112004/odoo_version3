'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fuelLogs as fuelLogsApi, vehicles as vehiclesApi, type FuelLog, type Vehicle } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions, ROLES } from '@/lib/permissions';
import { Fuel, Plus } from 'lucide-react';

export default function FuelLoggingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', liters: '', cost: '' });
  const [submitting, setSubmitting] = useState(false);

  const canAdd = user?.role === ROLES.Dispatcher || can(user?.role, Permissions.FUEL_LOGS.add);

  useEffect(() => {
    const allowed = user?.role === ROLES.Dispatcher || can(user?.role, Permissions.FUEL_LOGS.view) || can(user?.role, Permissions.FUEL_LOGS.add);
    if (!allowed) {
      router.replace('/dashboard/access-denied');
      return;
    }
    Promise.all([
      fuelLogsApi.list().then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
      vehiclesApi.list().then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
    ]).then(([l, v]) => {
      setLogs(l);
      setVehicles(v);
    }).finally(() => setLoading(false));
  }, [user?.role, router]);

  const availableVehicles = vehicles.filter((v) => v.status === 'Available' || v.status === 'On Trip');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    setSubmitting(true);
    try {
      await fuelLogsApi.create({
        vehicleId: form.vehicleId,
        liters: Number(form.liters),
        cost: Number(form.cost),
      });
      setForm({ vehicleId: '', liters: '', cost: '' });
      setShowForm(false);
      const res = await fuelLogsApi.list();
      if (res.success && res.data) setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert('Failed to add fuel log');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#E2E8F0]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">Fuel Logging</h1>
          <p className="mt-1 text-[#64748B]">Add liters and fuel cost; attach to vehicle</p>
        </div>
        {canAdd && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#1D4ED8]">
            <Plus className="h-4 w-4" /> Add fuel log
          </button>
        )}
      </div>

      {showForm && canAdd && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl bg-white border border-[#E2E8F0] shadow-card p-4 sm:p-5">
          <h2 className="font-semibold text-[#0F172A]">New fuel log</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-[#64748B]">Vehicle</label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]"
                required
              >
                <option value="">Select</option>
                {availableVehicles.length ? availableVehicles.map((v) => (
                  <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                )) : vehicles.map((v) => (
                  <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#64748B]">Liters</label>
              <input type="number" min={0} step={0.1} value={form.liters} onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]" required />
            </div>
            <div>
              <label className="block text-sm text-[#64748B]">Cost ($)</label>
              <input type="number" min={0} step={0.01} value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]" required />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-[#1D4ED8] disabled:opacity-50">
            {submitting ? 'Adding...' : 'Save'}
          </button>
        </form>
      )}

      <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#2563EB]">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#2563EB]">Liters</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#2563EB]">Cost</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#2563EB]">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((f) => (
              <tr key={f._id} className="border-b border-[#E2E8F0] hover:bg-[#F1F5F9]">
                <td className="px-4 py-3 font-medium text-[#0F172A]">{typeof f.vehicleId === 'object' && f.vehicleId?.name ? (f.vehicleId as { name: string }).name : '-'}</td>
                <td className="px-4 py-3 text-[#2563EB]">{f.liters}</td>
                <td className="px-4 py-3 text-[#2563EB]">${f.cost?.toLocaleString()}</td>
                <td className="px-4 py-3 text-[#2563EB]">{f.date ? new Date(f.date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="py-12 text-center text-[#64748B]">No fuel logs yet</div>}
      </div>
    </div>
  );
}