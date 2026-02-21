'use client';

import { useEffect, useState } from 'react';
import { maintenance as maintenanceApi, vehicles as vehiclesApi, type Maintenance, type Vehicle } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';
import { Wrench, Plus } from 'lucide-react';

export default function MaintenancePage() {
  const { user } = useAuth();
  const [list, setList] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', description: '', cost: '', severity: 'Medium' });
  const [submitting, setSubmitting] = useState(false);

  const canAdd = can(user?.role, Permissions.MAINTENANCE.add);
  const canEdit = can(user?.role, Permissions.MAINTENANCE.edit);

  const load = () => {
    Promise.all([
      maintenanceApi.list().then((r) => (Array.isArray(r.data) ? r.data : []) as Maintenance[]),
      vehiclesApi.list().then((r) => (Array.isArray(r.data) ? r.data : []) as Vehicle[]),
    ]).then(([m, v]) => { setList(m); setVehicles(v); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    setSubmitting(true);
    try {
      await maintenanceApi.create({
        vehicleId: form.vehicleId,
        description: form.description,
        cost: Number(form.cost),
        severity: form.severity,
      });
      setForm({ vehicleId: '', description: '', cost: '', severity: 'Medium' });
      setShowForm(false);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSave = async (id: string) => {
    try {
      await maintenanceApi.update(id, { description: editForm.description, cost: editForm.cost });
      setEditingId(null);
      load();
    } catch {
      alert('Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-zinc-800/50" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">Maintenance</h1>
          <p className="mt-1 text-zinc-400">Records and scheduling</p>
        </div>
        {canAdd && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-[#00ffc8]/20 px-4 py-2 text-[#00ffc8] hover:bg-[#00ffc8]/30">
            <Plus className="h-4 w-4" /> Add
          </button>
        )}
      </div>
      <div className="glass neon-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-900/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Description</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Cost</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Severity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
              {canEdit && <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Edit</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((m) => {
              const isEditing = editingId === m._id;
              return (
              <tr key={m._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3 text-white">{(m.vehicleId as { name?: string })?.name ?? m.vehicleId}</td>
                {isEditing ? (
                  <>
                    <td className="px-4 py-3">
                      <input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="min-w-[140px] rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-white" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min={0} value={editForm.cost} onChange={(e) => setEditForm((f) => ({ ...f, cost: Number(e.target.value) }))} className="w-20 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-white" />
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs ${m.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : m.severity === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-500/20 text-zinc-400'}`}>{m.severity}</span></td>
                    <td className="px-4 py-3 text-zinc-400">{new Date(m.date).toLocaleDateString()}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <button onClick={() => handleEditSave(m._id)} className="text-[#00ffc8] text-sm mr-2">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-zinc-400 text-sm">Cancel</button>
                      </td>
                    )}
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-zinc-300">{m.description}</td>
                    <td className="px-4 py-3 text-zinc-300">${m.cost}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                        m.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        m.severity === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-500/20 text-zinc-400'
                      }`}>{m.severity}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{new Date(m.date).toLocaleDateString()}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <button onClick={() => { setEditingId(m._id); setEditForm({ description: m.description, cost: m.cost }); }} className="text-[#00ffc8] text-sm">Edit</button>
                      </td>
                    )}
                  </>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && !showForm && <div className="py-12 text-center text-zinc-500">No maintenance records</div>}
      </div>

      {showForm && canAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass neon-border w-full max-w-md rounded-xl p-6">
            <h3 className="font-semibold text-white">Add Maintenance</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-zinc-400">Vehicle</label>
                <select value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-white" required>
                  <option value="">Select</option>
                  {vehicles.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400">Description</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400">Cost ($)</label>
                  <input type="number" min={0} value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">Severity</label>
                  <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-white">
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-zinc-600 py-2 text-zinc-300">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-[#00ffc8]/20 py-2 text-[#00ffc8] hover:bg-[#00ffc8]/30">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
