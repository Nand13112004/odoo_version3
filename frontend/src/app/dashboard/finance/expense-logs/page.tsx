'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fuelLogs as fuelLogsApi, maintenance as maintenanceApi, vehicles as vehiclesApi, type FuelLog, type Maintenance, type Vehicle } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';
import { Fuel, Wrench, DollarSign } from 'lucide-react';

export default function ExpenseLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    if (user?.role !== ROLES.FinancialAnalyst) {
      router.replace('/dashboard/access-denied');
      return;
    }
    Promise.all([
      fuelLogsApi.list().then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
      maintenanceApi.list().then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
      vehiclesApi.list().then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
    ]).then(([f, m, v]) => {
      setFuelLogs(f);
      setMaintenances(m);
      setVehicles(v);
    }).finally(() => setLoading(false));
  }, [user?.role, router]);

  const filterByVehicle = (id: string) => {
    if (!filterVehicle) return true;
    return id === filterVehicle;
  };
  const filterByDate = (d: string) => {
    const date = new Date(d);
    if (filterDateFrom && date < new Date(filterDateFrom)) return false;
    if (filterDateTo && date > new Date(filterDateTo + 'T23:59:59')) return false;
    return true;
  };

  const filteredFuel = fuelLogs.filter((f) => {
    const vId = typeof f.vehicleId === 'object' && f.vehicleId?._id ? (f.vehicleId as { _id: string })._id : String(f.vehicleId);
    return filterByVehicle(vId) && filterByDate(f.date || '');
  });
  const filteredMaint = maintenances.filter((m) => {
    const vId = typeof m.vehicleId === 'object' && m.vehicleId?._id ? (m.vehicleId as { _id: string })._id : String(m.vehicleId);
    return filterByVehicle(vId) && filterByDate(m.date || '');
  });

  const totalFuel = filteredFuel.reduce((s, f) => s + (f.cost || 0), 0);
  const totalMaint = filteredMaint.reduce((s, m) => s + (m.cost || 0), 0);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#F1F5F9]" />
      </div>
    );
  }

  if (user?.role !== ROLES.FinancialAnalyst) return null;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold neon-text">Expense Logs</h1>
        <p className="mt-1 text-[#64748B]">View-only access. Filter by vehicle and date range.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-[#64748B]">Vehicle</label>
          <select
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            className="mt-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A]"
          >
            <option value="">All</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#64748B]">From date</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="mt-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#64748B]">To date</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="mt-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A]"
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4 flex items-center gap-3">
          <Fuel className="h-8 w-8 text-[#2563EB]/70" />
          <div>
            <p className="text-xs text-[#64748B]">Fuel (filtered)</p>
            <p className="text-xl font-bold text-[#0F172A]">${totalFuel.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4 flex items-center gap-3">
          <Wrench className="h-8 w-8 text-amber-400/70" />
          <div>
            <p className="text-xs text-[#64748B]">Maintenance (filtered)</p>
            <p className="text-xl font-bold text-[#0F172A]">${totalMaint.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[#0F172A]">Fuel logs</h2>
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
                {filteredFuel.map((f) => (
                  <tr key={f._id} className="border-b border-zinc-800/50">
                    <td className="px-4 py-3 text-[#0F172A]">{typeof f.vehicleId === 'object' && f.vehicleId?.name ? (f.vehicleId as { name: string }).name : '-'}</td>
                    <td className="px-4 py-3 text-[#475569]">{f.liters}</td>
                    <td className="px-4 py-3 text-[#475569]">${f.cost?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#64748B]">{f.date ? new Date(f.date).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredFuel.length === 0 && <div className="py-8 text-center text-[#64748B]">No fuel logs</div>}
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[#0F172A]">Maintenance costs</h2>
          <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0]/50 bg-white/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaint.map((m) => (
                  <tr key={m._id} className="border-b border-zinc-800/50">
                    <td className="px-4 py-3 text-[#0F172A]">{typeof m.vehicleId === 'object' && m.vehicleId?.name ? (m.vehicleId as { name: string }).name : '-'}</td>
                    <td className="px-4 py-3 text-[#475569]">{m.description}</td>
                    <td className="px-4 py-3 text-[#475569]">${m.cost?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#64748B]">{m.date ? new Date(m.date).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMaint.length === 0 && <div className="py-8 text-center text-[#64748B]">No maintenance entries</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
