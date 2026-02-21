'use client';

import { useEffect, useState } from 'react';
import { drivers as driversApi, trips as tripsApi, type Driver, type Trip } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions, ROLES } from '@/lib/permissions';
import { AlertCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  'On Duty': 'bg-emerald-500/20 text-emerald-400',
  'Off Duty': 'bg-zinc-500/20 text-zinc-400',
  'On Trip': 'bg-blue-500/20 text-blue-400',
  Suspended: 'bg-red-500/20 text-red-400',
};

const STATUS_OPTIONS = ['On Duty', 'Off Duty', 'Suspended', 'On Trip'] as const;

export default function DriversPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Driver[]>([]);
  const [tripRates, setTripRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const isSafetyOfficer = user?.role === ROLES.SafetyOfficer;
  const [form, setForm] = useState({ name: '', licenseNumber: '', licenseExpiry: '', safetyScore: 90, status: 'On Duty', category: 'Truck' as 'Truck' | 'Van' | 'Bike' });
  const [submitting, setSubmitting] = useState(false);

  const canView = can(user?.role, Permissions.DRIVERS.view);
  const canAdd = can(user?.role, Permissions.DRIVERS.add);
  const canEdit = can(user?.role, Permissions.DRIVERS.edit);
  const canUpdateStatus = can(user?.role, Permissions.DRIVERS.updateStatus);
  const canDelete = can(user?.role, Permissions.DRIVERS.delete);

  const load = async () => {
    const [driversRes, tripsRes] = await Promise.all([
      driversApi.list(),
      isSafetyOfficer ? tripsApi.list() : Promise.resolve({ success: true, data: [] as Trip[] }),
    ]);
    if (driversRes.success && driversRes.data) setList(Array.isArray(driversRes.data) ? driversRes.data : []);
    if (isSafetyOfficer && tripsRes.success && tripsRes.data) {
      const trips = Array.isArray(tripsRes.data) ? tripsRes.data : [];
      const byDriver: Record<string, { total: number; completed: number }> = {};
      trips.forEach((t) => {
        const id = typeof t.driverId === 'object' && t.driverId?._id ? t.driverId._id : (t.driverId as string);
        if (!byDriver[id]) byDriver[id] = { total: 0, completed: 0 };
        byDriver[id].total += 1;
        if (t.status === 'Completed') byDriver[id].completed += 1;
      });
      const rates: Record<string, number> = {};
      Object.entries(byDriver).forEach(([id, v]) => {
        rates[id] = v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0;
      });
      setTripRates(rates);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [isSafetyOfficer]);

  const handleStatusChange = async (driverId: string, status: string) => {
    if (!canUpdateStatus) return;
    try {
      await driversApi.updateStatus(driverId, status);
      load();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (driverId: string, name: string) => {
    if (!canDelete || !confirm(`Delete driver "${name}"? This cannot be undone.`)) return;
    try {
      await driversApi.delete(driverId);
      load();
    } catch {
      alert('Failed to delete driver');
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    setSubmitting(true);
    try {
      await driversApi.create({
        name: form.name,
        licenseNumber: form.licenseNumber,
        licenseExpiry: form.licenseExpiry,
        safetyScore: form.safetyScore,
        status: form.status,
        category: form.category,
      });
      setForm({ name: '', licenseNumber: '', licenseExpiry: '', safetyScore: 90, status: 'On Duty', category: 'Truck' });
      setShowForm(false);
      load();
    } catch (err) {
      alert('Failed to add driver');
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="mt-1 text-sm">You do not have permission to view drivers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">{isSafetyOfficer ? 'Driver Safety Profiles' : 'Driver Management'}</h1>
          <p className="mt-1 text-zinc-400">{isSafetyOfficer ? 'Safety score, trip completion rate, status' : 'Licenses, compliance, and status'}</p>
        </div>
        {canAdd && !isSafetyOfficer && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-[#00ffc8]/20 px-4 py-2 text-sm text-[#00ffc8]"
          >
            {showForm ? 'Cancel' : 'Add Driver'}
          </button>
        )}
      </div>

      {showForm && canAdd && (
        <form onSubmit={handleAddDriver} className="mb-6 space-y-3 rounded-lg bg-zinc-900/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white"
            />
            <input
              required
              placeholder="License Number"
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white"
            />
            <input
              required
              type="date"
              value={form.licenseExpiry}
              onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
              className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={form.safetyScore}
              onChange={(e) => setForm({ ...form, safetyScore: Number(e.target.value) })}
              className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white"
              placeholder="Safety Score"
            />
            <div>
              <label className="block text-xs text-zinc-500">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as 'Truck' | 'Van' | 'Bike' })}
                className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white"
              >
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Bike">Bike</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="rounded-lg bg-[#00ffc8]/20 px-4 py-2 text-sm text-[#00ffc8]">
            {submitting ? 'Adding...' : 'Add Driver'}
          </button>
        </form>
      )}

      <div className="glass neon-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-900/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">License</th>
              {!isSafetyOfficer && <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Category</th>}
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Expiry</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Safety Score</th>
              {isSafetyOfficer && <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Trip completion %</th>}
              {isSafetyOfficer && <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Incident history</th>}
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
              {canDelete && <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((d) => {
              const expired = d.licenseExpiry && new Date(d.licenseExpiry) < new Date();
              return (
                <tr key={d._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{d.licenseNumber}</td>
                  {!isSafetyOfficer && <td className="px-4 py-3 text-zinc-300">{d.category ?? 'Truck'}</td>}
                  <td className="px-4 py-3">
                    <span className={expired ? 'text-red-400' : 'text-zinc-300'}>
                      {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '-'}
                      {expired && <AlertCircle className="ml-1 inline h-4 w-4 text-red-400" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={(d.safetyScore ?? 100) < 70 ? 'text-amber-400' : 'text-zinc-300'}>{d.safetyScore ?? '-'}</span>
                  </td>
                  {isSafetyOfficer && <td className="px-4 py-3 text-zinc-300">{tripRates[d._id] != null ? `${tripRates[d._id]}%` : '–'}</td>}
                  {isSafetyOfficer && <td className="px-4 py-3 text-zinc-500">None</td>}
                  <td className="px-4 py-3">
                    {canUpdateStatus ? (
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d._id, e.target.value)}
                        className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-white"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[d.status] || 'bg-zinc-500/20 text-zinc-400'}`}>
                        {d.status}
                      </span>
                    )}
                  </td>
                  {canDelete && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(d._id, d.name)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <div className="py-12 text-center text-zinc-500">No drivers</div>}
      </div>
    </div>
  );
}
