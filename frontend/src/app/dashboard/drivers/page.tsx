'use client';

import { useEffect, useState } from 'react';
import { drivers as driversApi, type Driver } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', licenseNumber: '', licenseExpiry: '', safetyScore: 90, status: 'On Duty' });
  const [submitting, setSubmitting] = useState(false);

  const canView = can(user?.role, Permissions.DRIVERS.view);
  const canAdd = can(user?.role, Permissions.DRIVERS.add);
  const canUpdateStatus = can(user?.role, Permissions.DRIVERS.updateStatus);

  const load = () => {
    driversApi.list().then((r) => { if (r.success && r.data) setList(Array.isArray(r.data) ? r.data : []); }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (driverId: string, status: string) => {
    if (!canUpdateStatus) return;
    try {
      await driversApi.update(driverId, { status });
      load();
    } catch {
      alert('Failed to update status');
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
      });
      setForm({ name: '', licenseNumber: '', licenseExpiry: '', safetyScore: 90, status: 'On Duty' });
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
          <h1 className="text-3xl font-bold neon-text">Driver Management</h1>
          <p className="mt-1 text-zinc-400">Licenses, compliance, and status</p>
        </div>
        {canAdd && (
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
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Expiry</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Safety</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => {
              const expired = d.licenseExpiry && new Date(d.licenseExpiry) < new Date();
              return (
                <tr key={d._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{d.licenseNumber}</td>
                  <td className="px-4 py-3">
                    <span className={expired ? 'text-red-400' : 'text-zinc-300'}>
                      {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '-'}
                      {expired && <AlertCircle className="ml-1 inline h-4 w-4 text-red-400" />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{d.safetyScore ?? '-'}</td>
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
