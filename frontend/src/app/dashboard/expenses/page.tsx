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
        <div className="h-64 animate-pulse rounded-xl bg-[#F1F5F9]" />
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
        <p className="mt-1 text-[#64748B]">View all fuel logs and maintenance costs. Edit entries when permitted.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4 flex items-center gap-3">
          <Fuel className="h-8 w-8 text-[#2563EB]/70" />
          <div>
            <p className="text-xs text-[#64748B]">Total fuel cost</p>
            <p className="text-xl font-bold text-[#0F172A]">${totalFuelCost.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4 flex items-center gap-3">
          <Wrench className="h-8 w-8 text-amber-400/70" />
          <div>
            <p className="text-xs text-[#64748B]">Total maintenance cost</p>
            <p className="text-xl font-bold text-[#0F172A]">${totalMaintCost.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[#0F172A]">Fuel logs</h2>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]/50 bg-white/30">
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Liters</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Date</th>
                {canEdit && <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Edit</th>}
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((f) => {
                const vehicleName = typeof f.vehicleId === 'object' && f.vehicleId?.name ? f.vehicleId.name : '-';
                const isEditing = editingFuel === f._id;
                return (
                  <tr key={f._id} className="border-b border-zinc-800/50 hover:bg-[#F1F5F9]/30">
                    <td className="px-4 py-3 text-[#0F172A]">{vehicleName}</td>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={editFuelForm.liters}
                            onChange={(e) => setEditFuelForm((x) => ({ ...x, liters: Number(e.target.value) }))}
                            className="w-20 rounded border border-[#E2E8F0] bg-[#F1F5F9] px-2 py-1 text-[#0F172A]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={editFuelForm.cost}
                            onChange={(e) => setEditFuelForm((x) => ({ ...x, cost: Number(e.target.value) }))}
                            className="w-24 rounded border border-[#E2E8F0] bg-[#F1F5F9] px-2 py-1 text-[#0F172A]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={editFuelForm.date}
                            onChange={(e) => setEditFuelForm((x) => ({ ...x, date: e.target.value }))}
                            className="rounded border border-[#E2E8F0] bg-[#F1F5F9] px-2 py-1 text-[#0F172A]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleSaveFuel(f._id)} className="text-[#2563EB] text-sm mr-2">Save</button>
                          <button onClick={() => setEditingFuel(null)} className="text-[#64748B] text-sm">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-[#475569]">{f.liters}</td>
                        <td className="px-4 py-3 text-[#475569]">${f.cost?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[#64748B]">{f.date ? new Date(f.date).toLocaleDateString() : '-'}</td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setEditingFuel(f._id);
                                setEditFuelForm({ liters: f.liters, cost: f.cost, date: f.date ? new Date(f.date).toISOString().slice(0, 10) : '' });
                              }}
                              className="text-[#2563EB] text-sm"
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
          {fuelLogs.length === 0 && <div className="py-8 text-center text-[#64748B]">No fuel logs</div>}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#0F172A]">Maintenance costs</h2>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]/50 bg-white/30">
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Date</th>
                {canEdit && <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Edit</th>}
              </tr>
            </thead>
            <tbody>
              {maintenances.map((m) => {
                const vehicleId = typeof m.vehicleId === 'object' && m.vehicleId?._id ? (m.vehicleId as { name?: string }).name : '-';
                const isEditing = editingMaint === m._id;
                return (
                  <tr key={m._id} className="border-b border-zinc-800/50 hover:bg-[#F1F5F9]/30">
                    <td className="px-4 py-3 text-[#0F172A]">{vehicleId}</td>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            value={editMaintForm.description}
                            onChange={(e) => setEditMaintForm((x) => ({ ...x, description: e.target.value }))}
                            className="min-w-[180px] rounded border border-[#E2E8F0] bg-[#F1F5F9] px-2 py-1 text-[#0F172A]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={editMaintForm.cost}
                            onChange={(e) => setEditMaintForm((x) => ({ ...x, cost: Number(e.target.value) }))}
                            className="w-24 rounded border border-[#E2E8F0] bg-[#F1F5F9] px-2 py-1 text-[#0F172A]"
                          />
                        </td>
                        <td className="px-4 py-3 text-[#64748B]">{m.date ? new Date(m.date).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleSaveMaint(m._id)} className="text-[#2563EB] text-sm mr-2">Save</button>
                          <button onClick={() => setEditingMaint(null)} className="text-[#64748B] text-sm">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-[#475569]">{m.description}</td>
                        <td className="px-4 py-3 text-[#475569]">${m.cost?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[#64748B]">{m.date ? new Date(m.date).toLocaleDateString() : '-'}</td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setEditingMaint(m._id);
                                setEditMaintForm({ description: m.description, cost: m.cost });
                              }}
                              className="text-[#2563EB] text-sm"
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
          {maintenances.length === 0 && <div className="py-8 text-center text-[#64748B]">No maintenance entries</div>}
        </div>
      </div>
    </div>
  );
}
