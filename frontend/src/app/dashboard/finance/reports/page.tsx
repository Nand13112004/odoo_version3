'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboard as dashboardApi, vehicles as vehiclesApi, exportApi, type DashboardStats, type Vehicle } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';
import { FileDown, DollarSign } from 'lucide-react';

function downloadUrl(url: string, filename: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => alert('Download failed'));
}

export default function FinancialReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== ROLES.FinancialAnalyst) {
      router.replace('/dashboard/access-denied');
      return;
    }
    Promise.all([
      dashboardApi.stats().then((r) => r.data as DashboardStats),
      vehiclesApi.list().then((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : [])),
    ]).then(([s, v]) => {
      setStats(s);
      setVehicles(v);
    }).finally(() => setLoading(false));
  }, [user?.role, router]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#E2E8F0]" />
      </div>
    );
  }

  if (user?.role !== ROLES.FinancialAnalyst) return null;

  const profitability = vehicles.map((v) => {
    const rev = v.totalRevenue || 0;
    const maint = v.totalMaintenanceCost || 0;
    const fuel = v.totalFuelCost || 0;
    const totalKm = (v.odometer || 0);
    const costPerKm = totalKm > 0 ? ((maint + fuel) / totalKm).toFixed(2) : '–';
    return { name: v.name, revenue: rev, expense: maint + fuel, profit: rev - maint - fuel, costPerKm };
  });

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">Financial Reports</h1>
          <p className="mt-1 text-[#64748B]">Monthly summary, vehicle profitability, downloadable reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadUrl(exportApi.vehiclesCsv(), 'vehicles.csv')} className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#E2E8F0]">
            <FileDown className="h-4 w-4" /> Vehicles CSV
          </button>
          <button onClick={() => downloadUrl(exportApi.tripsCsv(), 'trips.csv')} className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#E2E8F0]">
            <FileDown className="h-4 w-4" /> Trips CSV
          </button>
          <button onClick={() => downloadUrl(exportApi.reportPdf(), 'fleet-report.pdf')} className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#1D4ED8]">
            <FileDown className="h-4 w-4" /> PDF Report
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-[#0F172A]">Monthly summary</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
            <p className="text-xs text-[#64748B]">Operational Cost</p>
            <p className="mt-2 text-xl font-bold text-[#0F172A]">${Number(stats?.totalOperationalCost ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
            <p className="text-xs text-[#64748B]">Monthly Revenue</p>
            <p className="mt-2 text-xl font-bold text-[#2563EB]">${Number(stats?.monthlyRevenue ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
            <p className="text-xs text-[#64748B]">Monthly Profit</p>
            <p className="mt-2 text-xl font-bold text-[#0F172A]">${Number(stats?.monthlyProfit ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4">
            <p className="text-xs text-[#64748B]">Fuel + Maintenance</p>
            <p className="mt-2 text-xl font-bold text-[#0F172A]">${Number((stats?.fuelExpenses ?? 0) + (stats?.maintenanceCosts ?? 0)).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#0F172A]">Vehicle profitability</h2>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]/50 bg-white/30">
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Revenue</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Expense</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Profit</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Cost/km</th>
              </tr>
            </thead>
            <tbody>
              {profitability.map((p, i) => (
                <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F1F5F9]">
                  <td className="px-4 py-3 font-medium text-[#0F172A]">{p.name}</td>
                  <td className="px-4 py-3 text-[#2563EB]">${p.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#2563EB]">${p.expense.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#2563EB]">${p.profit.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#64748B]">${p.costPerKm}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {profitability.length === 0 && <div className="py-12 text-center text-[#64748B]">No data</div>}
        </div>
      </div>
    </div>
  );
}
