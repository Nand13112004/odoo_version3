'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fuelLogs as fuelLogsApi, maintenance as maintenanceApi, type FuelLog, type Maintenance } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions, ROLES } from '@/lib/permissions';
import { Fuel, Wrench, DollarSign } from 'lucide-react';

export default function ExpensesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFuel, setEditingFuel] = useState<string | null>(null);
  const [editingMaint, setEditingMaint] = useState<string | null>(null);
  const [editFuelForm, setEditFuelForm] = useState({ liters: 0, cost: 0, date: '' });
  const [editMaintForm, setEditMaintForm] = useState({ description: '', cost: 0 });

  const canAccess = user?.role === ROLES.Manager || can(user?.role, Permissions.EXPENSES.view);
  const canEdit = user?.role === ROLES.Manager || can(user?.role, Permissions.EXPENSES.edit);

  useEffect(() => {
    if (!canAccess) {
      router.replace('/dashboard/access-denied');
      return;
    }
    Promise.all([
      fuelLogsApi.list().then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
      maintenanceApi.list().then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
    ]).then(([fuel, maint]) => {
      setFuelLogs(fuel);
      setMaintenances(maint);
    }).finally(() => setLoading(false));
  }, [canAccess, router]);

  const handleSaveFuel = async (id: string) => {
    try {
      await fuelLogsApi.update(id, {
        liters: editFuelForm.liters,
        cost: editFuelForm.cost,
        date: editFuelForm.date || undefined,
      });
      const res = await fuelLogsApi.list();
      if (res.success && res.data) setFuelLogs(Array.isArray(res.data) ? res.data : []);
      setEditingFuel(null);
    } catch (e) {
      alert('Failed to update');
    }
  };

  const handleSaveMaint = async (id: string) => {
    try {
      await maintenanceApi.update(id, { description: editMaintForm.description, cost: editMaintForm.cost });
      const res = await maintenanceApi.list();
      if (res.success && res.data) setMaintenances(Array.isArray(res.data) ? res.data : []);
      setEditingMaint(null);
    } catch (e) {
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

  if (!canAccess) return null;

  const totalFuelCost = fuelLogs.reduce((s, f) => s + (f.cost || 0), 0);
  const totalMaintCost = maintenances.reduce((s, m) => s + (m.cost || 0), 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold neon-text">Expenses</h1>
        <p className="mt-1 text-zinc-400">View all fuel logs and maintenance costs. Edit entries when permitted.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="glass neon-border rounded-lg p-4 flex items-center gap-3">
          <Fuel className="h-8 w-8 text-[#00ffc8]/70" />
          <div>
            <p className="text-xs text-zinc-400">Total fuel cost</p>
            <p className="text-xl font-bold text-white">${totalFuelCost.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass neon-border rounded-lg p-4 flex items-center gap-3">
          <Wrench className="h-8 w-8 text-amber-400/70" />
          <div>
            <p className="text-xs text-zinc-400">Total maintenance cost</p>
            <p className="text-xl font-bold text-white">${totalMaintCost.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Fuel logs</h2>
        <div className="glass neon-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-700/50 bg-zinc-900/30">
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Liters</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
                {canEdit && <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Edit</th>}
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((f) => {
                const vehicleName = typeof f.vehicleId === 'object' && f.vehicleId?.name ? f.vehicleId.name : '-';
                const isEditing = editingFuel === f._id;
                return (
                  <tr key={f._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-white">{vehicleName}</td>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={editFuelForm.liters}
                            onChange={(e) => setEditFuelForm((x) => ({ ...x, liters: Number(e.target.value) }))}
                            className="w-20 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={editFuelForm.cost}
                            onChange={(e) => setEditFuelForm((x) => ({ ...x, cost: Number(e.target.value) }))}
                            className="w-24 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={editFuelForm.date}
                            onChange={(e) => setEditFuelForm((x) => ({ ...x, date: e.target.value }))}
                            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleSaveFuel(f._id)} className="text-[#00ffc8] text-sm mr-2">Save</button>
                          <button onClick={() => setEditingFuel(null)} className="text-zinc-400 text-sm">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-zinc-300">{f.liters}</td>
                        <td className="px-4 py-3 text-zinc-300">${f.cost?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-zinc-400">{f.date ? new Date(f.date).toLocaleDateString() : '-'}</td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setEditingFuel(f._id);
                                setEditFuelForm({ liters: f.liters, cost: f.cost, date: f.date ? new Date(f.date).toISOString().slice(0, 10) : '' });
                              }}
                              className="text-[#00ffc8] text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {fuelLogs.length === 0 && <div className="py-8 text-center text-zinc-500">No fuel logs</div>}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Maintenance costs</h2>
        <div className="glass neon-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-700/50 bg-zinc-900/30">
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
                {canEdit && <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Edit</th>}
              </tr>
            </thead>
            <tbody>
              {maintenances.map((m) => {
                const vehicleId = typeof m.vehicleId === 'object' && m.vehicleId?._id ? (m.vehicleId as { name?: string }).name : '-';
                const isEditing = editingMaint === m._id;
                return (
                  <tr key={m._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-white">{vehicleId}</td>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            value={editMaintForm.description}
                            onChange={(e) => setEditMaintForm((x) => ({ ...x, description: e.target.value }))}
                            className="min-w-[180px] rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={editMaintForm.cost}
                            onChange={(e) => setEditMaintForm((x) => ({ ...x, cost: Number(e.target.value) }))}
                            className="w-24 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{m.date ? new Date(m.date).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleSaveMaint(m._id)} className="text-[#00ffc8] text-sm mr-2">Save</button>
                          <button onClick={() => setEditingMaint(null)} className="text-zinc-400 text-sm">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-zinc-300">{m.description}</td>
                        <td className="px-4 py-3 text-zinc-300">${m.cost?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-zinc-400">{m.date ? new Date(m.date).toLocaleDateString() : '-'}</td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setEditingMaint(m._id);
                                setEditMaintForm({ description: m.description, cost: m.cost });
                              }}
                              className="text-[#00ffc8] text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {maintenances.length === 0 && <div className="py-8 text-center text-zinc-500">No maintenance entries</div>}
        </div>
      </div>
    </div>
  );
}
