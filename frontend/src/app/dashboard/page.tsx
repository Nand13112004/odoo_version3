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

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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
      className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#64748B] font-medium">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#0F172A] font-headline">{value}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#2563EB]/5">
          <Icon className="h-6 w-6 text-[#2563EB]" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
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
          <p className="text-sm text-[#64748B] font-medium">{user.communityName}</p>
        )}
        <h1 className="text-3xl font-bold neon-text">Command Center</h1>
        <p className="mt-1 text-[#64748B]">Real-time fleet overview</p>
      </div>

      {anomaly && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-4 py-3 text-[#0F172A]"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#F59E0B]" />
          <span className="text-sm font-medium">Smart anomaly: {anomaly}</span>
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
                  <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-card">
                  <p className="text-sm text-[#64748B] font-medium">Vehicle ROI (%)</p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                    {stats.vehicleROI.slice(0, 8).map((v, i) => (
                      <li key={i} className="text-sm text-[#0F172A]">{v.name}: {v.roi.toFixed(1)}%</li>
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
              <div className="bg-white border border-[#E2E8F0] shadow-card col-span-full rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0F172A]">Compliance alerts</p>
                <ul className="mt-2 list-inside list-disc text-sm text-[#475569]">
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
          className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-card"
        >
          <h2 className="mb-4 text-lg font-semibold text-[#0F172A] font-headline">Revenue vs Expense</h2>
          <div className="h-64">
            {charts?.revenueVsExpense?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenueVsExpense}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }} />
                  <Bar dataKey="revenue" fill="#2563EB" name="Revenue" radius={4} />
                  <Bar dataKey="expense" fill="#64748B" name="Expense" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[#64748B]">No data</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-card"
        >
          <h2 className="mb-4 text-lg font-semibold text-[#0F172A] font-headline">Fuel Cost Trend</h2>
          <div className="h-64">
            {charts?.fuelTrend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.fuelTrend}>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }} />
                  <Line type="monotone" dataKey="cost" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[#64748B]">No data</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-card"
        >
          <h2 className="mb-4 text-lg font-semibold text-[#0F172A] font-headline">Fleet Utilization</h2>
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
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[#64748B]">No data</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-card"
        >
          <h2 className="mb-4 text-lg font-semibold text-[#0F172A] font-headline">AI Insight Panel</h2>
          <p className="text-sm text-[#64748B]">
            Risk scores and ROI are updated in real time. Use the AI Assistant for natural language queries and financial advice.
          </p>
          <a
            href="/dashboard/ai-chat"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-[#0F172A] shadow-btn-primary hover:bg-[#1D4ED8] transition-all"
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
          className="fixed bottom-6 right-6 z-50 flex max-w-sm gap-3 rounded-xl bg-white border border-[#E2E8F0] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2563EB]/10 shrink-0">
            <Sparkles className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div>
            <p className="font-semibold text-[#0F172A] text-sm">AI Daily Summary</p>
            <p className="mt-1 text-sm text-[#64748B]">
              Your fleet metrics are live. {stats?.highRiskVehicles ? `${stats.highRiskVehicles} vehicle(s) have elevated risk.` : 'All vehicles within normal range.'}
            </p>
          </div>
          <button onClick={() => setShowAiPopup(false)} className="shrink-0 text-[#64748B] hover:text-[#0F172A] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      <div className="fixed bottom-6 left-64 z-40" />
    </div>
  );
}
