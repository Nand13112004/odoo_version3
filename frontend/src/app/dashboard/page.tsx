'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Wrench,
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  Sparkles,
  X,
} from 'lucide-react';
import { dashboard as dashboardApi, type DashboardStats, type ChartData } from '@/lib/api';
import { getSocket, useSocketEvents } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'];

function KpiCard({
  title,
  value,
  icon: Icon,
  delay = 0,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass neon-border rounded-xl p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-600">{title}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
        </div>
        <Icon className="h-10 w-10 text-teal-500" />
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  //const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showAiPopup, setShowAiPopup] = useState(true);
  const [anomaly, setAnomaly] = useState<string | null>(null);
  const canViewAnalytics = can(user?.role, Permissions.ACTIONS.viewAnalytics);

  const load = async () => {
    try {
      const statsPromise = dashboardApi.stats().then((r) => r.data);
      const chartsPromise = canViewAnalytics ? dashboardApi.charts().then((r) => r.data) : Promise.resolve(null);
      const [s, c] = await Promise.all([statsPromise, chartsPromise]);
      setStats(s as DashboardStats);
      setCharts(c as ChartData | null);
      const d = s as DashboardStats;
      if (d?.scope !== 'limited' && d?.highRiskVehicles != null && d.highRiskVehicles > 2) {
        setAnomaly(`${d.highRiskVehicles} high-risk vehicles need attention.`);
      }
    } catch {
      setStats(null);
      setCharts(null);
    }
  };

  useEffect(() => {
    load();
  }, [canViewAnalytics]);

  useSocketEvents({
    vehicleStatusUpdated: () => load(),
    tripCreated: () => load(),
    maintenanceAdded: () => load(),
  });

  useEffect(() => {
    const s = getSocket();
    if (s) s.connect();
    return () => { s?.disconnect(); };
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        {user?.communityName && (
          <p className="text-sm text-zinc-600">{user.communityName}</p>
        )}
        <h1 className="text-3xl font-bold neon-text">Command Center</h1>
        <p className="mt-1 text-zinc-600">Real-time fleet overview</p>
      </div>

      {anomaly && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>Smart anomaly: {anomaly}</span>
        </motion.div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats?.scope !== 'compliance' && (
          <>
            <KpiCard title="Active Fleet" value={stats?.activeFleetCount ?? '–'} icon={Truck} delay={0} />
            {stats?.scope === 'full' && (
              <KpiCard title="Maintenance Alerts" value={stats?.vehiclesInMaintenance ?? '–'} icon={Wrench} delay={0.05} />
            )}
            {stats?.scope === 'full' && (
              <KpiCard title="Utilization %" value={`${stats?.utilizationPercent ?? 0}%`} icon={TrendingUp} delay={0.1} />
            )}
            <KpiCard title="Pending Cargo (kg)" value={stats?.pendingCargo ?? '–'} icon={Package} delay={0.15} />
            {stats?.scope === 'full' && (
              <KpiCard title="High Risk Vehicles" value={stats?.highRiskVehicles ?? '–'} icon={AlertTriangle} delay={0.2} />
            )}
            {(stats?.scope === 'full' || stats?.scope === 'financial') && (
              <KpiCard title="Financial Overview (Monthly Profit)" value={`$${Number(stats?.monthlyProfit ?? 0).toFixed(0)}`} icon={DollarSign} delay={0.25} />
            )}
            {stats?.scope === 'limited' && (
              <KpiCard title="Available Vehicles" value={stats?.availableVehiclesCount ?? '–'} icon={Truck} delay={0.2} />
            )}
            {stats?.scope === 'financial' && (
              <>
                <KpiCard title="Total Operational Cost" value={`$${Number(stats?.totalOperationalCost ?? 0).toFixed(0)}`} icon={DollarSign} delay={0.1} />
                <KpiCard title="Fuel Expenses" value={`$${Number(stats?.fuelExpenses ?? 0).toFixed(0)}`} icon={DollarSign} delay={0.15} />
                <KpiCard title="Maintenance Costs" value={`$${Number(stats?.maintenanceCosts ?? 0).toFixed(0)}`} icon={DollarSign} delay={0.2} />
                {stats?.vehicleROI?.length ? (
                  <div className="glass neon-border rounded-xl p-5">
                  <p className="text-sm text-zinc-600">Vehicle ROI (%)</p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                    {stats.vehicleROI.slice(0, 8).map((v, i) => (
                      <li key={i} className="text-sm text-zinc-900">{v.name}: {v.roi.toFixed(1)}%</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
        {stats?.scope === 'compliance' && (
          <>
            <KpiCard title="Expired Licenses" value={stats?.expiredLicensesCount ?? '–'} icon={AlertTriangle} delay={0} />
            <KpiCard title="Suspended Drivers" value={stats?.suspendedDriversCount ?? '–'} icon={AlertTriangle} delay={0.05} />
            <KpiCard title="Low Safety Score Alerts" value={stats?.lowSafetyScoreCount ?? '–'} icon={AlertTriangle} delay={0.1} />
            {(stats?.complianceAlerts?.length ?? 0) > 0 && (
              <div className="glass neon-border col-span-full rounded-xl p-4">
                <p className="text-sm font-medium text-amber-700">Compliance alerts</p>
                <ul className="mt-2 list-inside list-disc text-sm text-zinc-700">
                  {stats.complianceAlerts!.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {stats?.scope !== 'limited' && stats?.scope !== 'compliance' && (
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass neon-border rounded-xl p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Revenue vs Expense</h2>
          <div className="h-64">
            {charts?.revenueVsExpense?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenueVsExpense}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="revenue" fill="#0d9488" name="Revenue" radius={4} />
                  <Bar dataKey="expense" fill="#f59e0b" name="Expense" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">No data</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass neon-border rounded-xl p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Fuel Cost Trend</h2>
          <div className="h-64">
            {charts?.fuelTrend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.fuelTrend}>
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0' }} />
                  <Line type="monotone" dataKey="cost" stroke="#0d9488" strokeWidth={2} dot={{ fill: '#0d9488' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">No data</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass neon-border rounded-xl p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Fleet Utilization</h2>
          <div className="h-64">
            {charts?.fleetUtilization?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.fleetUtilization}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {charts.fleetUtilization.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">No data</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass neon-border rounded-xl p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">AI Insight Panel</h2>
          <p className="text-sm text-zinc-600">
            Risk scores and ROI are updated in real time. Use the AI Assistant for natural language queries and financial advice.
          </p>
          <a
            href="/dashboard/ai-chat"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-100 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-200"
          >
            <Sparkles className="h-4 w-4" />
            Open AI Assistant
          </a>
        </motion.div>
      </div>
      )}

      {showAiPopup && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-50 flex max-w-sm gap-3 rounded-xl glass neon-border p-4 shadow-xl"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-teal-600" />
          <div>
            <p className="font-medium text-zinc-900">AI Daily Summary</p>
            <p className="mt-1 text-sm text-zinc-600">
              Your fleet metrics are live. {stats?.highRiskVehicles ? `${stats.highRiskVehicles} vehicle(s) have elevated risk.` : 'All vehicles within normal range.'}
            </p>
          </div>
          <button onClick={() => setShowAiPopup(false)} className="shrink-0 text-zinc-500 hover:text-zinc-900">
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      <div className="fixed bottom-6 left-64 z-40">
        {/* <button
          className="flex items-center gap-2 rounded-full border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800"
          title="Voice command (UI simulation)"
        >
          <Mic className="h-4 w-4" />
          Voice
        </button> */}
      </div>
    </div>
  );
}
