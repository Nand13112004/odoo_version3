'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboard as dashboardApi, exportApi, type ChartData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions, ROLES } from '@/lib/permissions';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileDown } from 'lucide-react';

const COLORS = ['#2563EB', '#00cc9e', '#009973', '#00664d'];

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

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!can(user?.role, Permissions.ACTIONS.viewAnalytics)) {
      router.replace('/dashboard/access-denied');
      return;
    }
    dashboardApi.charts().then((r) => setCharts(r.data as ChartData)).catch(() => setCharts(null)).finally(() => setLoading(false));
  }, [user?.role, router]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-96 animate-pulse rounded-xl bg-[#E2E8F0]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">Operational Analytics</h1>
          <p className="mt-1 text-[#64748B]">Fuel efficiency, Vehicle ROI, Cost-per-km, Fleet utilization</p>
        </div>
        {can(user?.role, Permissions.ACTIONS.exportReports) && (
          <div className="flex gap-2">
            <button onClick={() => downloadUrl(exportApi.vehiclesCsv(), 'vehicles.csv')} className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#E2E8F0]">
              <FileDown className="h-4 w-4" /> CSV
            </button>
            <button onClick={() => downloadUrl(exportApi.reportPdf(), 'fleet-report.pdf')} className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#1D4ED8]">
              <FileDown className="h-4 w-4" /> PDF
            </button>
          </div>
        )}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-[#0F172A]">Revenue vs Expense by Vehicle</h2>
          <div className="h-72">
            {charts?.revenueVsExpense?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenueVsExpense}>
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip contentStyle={{ background: '#18181b' }} />
                  <Bar dataKey="revenue" fill="#2563EB" name="Revenue" />
                  <Bar dataKey="expense" fill="#f59e0b" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-[#64748B]">No data</div>}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-[#0F172A]">Fuel Cost Trend</h2>
          <div className="h-72">
            {charts?.fuelTrend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.fuelTrend}>
                  <XAxis dataKey="month" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip contentStyle={{ background: '#18181b' }} />
                  <Line type="monotone" dataKey="cost" stroke="#2563EB" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-[#64748B]">No data</div>}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-[#0F172A]">Fleet Utilization</h2>
          <div className="h-72">
            {charts?.fleetUtilization?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.fleetUtilization} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {charts.fleetUtilization.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#18181b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-[#64748B]">No data</div>}
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-[#0F172A]">ROI Comparison</h2>
          <div className="h-72">
            {charts?.roiComparison?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.roiComparison} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" stroke="#71717a" />
                  <YAxis type="category" dataKey="name" stroke="#71717a" width={80} />
                  <Tooltip contentStyle={{ background: '#18181b' }} />
                  <Bar dataKey="roi" fill="#2563EB" name="ROI %" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-[#64748B]">No data</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
