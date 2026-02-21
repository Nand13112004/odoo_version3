'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboard as dashboardApi, type ChartData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#00ffc8', '#00cc9e', '#009973', '#00664d'];

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
        <div className="h-96 animate-pulse rounded-xl bg-zinc-800/50" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold neon-text">Analytics</h1>
      <p className="mt-1 text-zinc-400">Fleet performance and ROI</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass neon-border rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-white">Revenue vs Expense by Vehicle</h2>
          <div className="h-72">
            {charts?.revenueVsExpense?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenueVsExpense}>
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip contentStyle={{ background: '#18181b' }} />
                  <Bar dataKey="revenue" fill="#00ffc8" name="Revenue" />
                  <Bar dataKey="expense" fill="#f59e0b" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-zinc-500">No data</div>}
          </div>
        </div>
        <div className="glass neon-border rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-white">Fuel Cost Trend</h2>
          <div className="h-72">
            {charts?.fuelTrend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.fuelTrend}>
                  <XAxis dataKey="month" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip contentStyle={{ background: '#18181b' }} />
                  <Line type="monotone" dataKey="cost" stroke="#00ffc8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-zinc-500">No data</div>}
          </div>
        </div>
        <div className="glass neon-border rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-white">Fleet Utilization</h2>
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
            ) : <div className="flex h-full items-center justify-center text-zinc-500">No data</div>}
          </div>
        </div>
        <div className="glass neon-border rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-white">ROI Comparison</h2>
          <div className="h-72">
            {charts?.roiComparison?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.roiComparison} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" stroke="#71717a" />
                  <YAxis type="category" dataKey="name" stroke="#71717a" width={80} />
                  <Tooltip contentStyle={{ background: '#18181b' }} />
                  <Bar dataKey="roi" fill="#00ffc8" name="ROI %" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-zinc-500">No data</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
