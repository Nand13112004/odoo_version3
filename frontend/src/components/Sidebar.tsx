'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  User,
  MapPin,
  Wrench,
  CheckSquare,
  BarChart3,
  Map,
  MessageSquare,
  LogOut,
  FileDown,
  Fuel,
  ShieldCheck,
  DollarSign,
  Users,
} from 'lucide-react';
import { Permissions, can, ROLES, MANAGER_NAV, DISPATCHER_NAV, SAFETY_OFFICER_NAV } from '@/lib/permissions';

const COMMUNITY_NAV = [
  { href: '/dashboard/community', label: 'Community Dashboard' },
  { href: '/dashboard/community/settings', label: 'Community Settings' },
  { href: '/dashboard/community/invite', label: 'Invite Members' },
  { href: '/dashboard/community/members', label: 'View Members' },
];

const iconByPath: Record<string, React.ComponentType<{ className?: string }>> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/vehicles': Truck,
  '/dashboard/maintenance': Wrench,
  '/dashboard/drivers': User,
  '/dashboard/compliance': ShieldCheck,
  '/dashboard/analytics': BarChart3,
  '/dashboard/expenses': DollarSign,
  '/dashboard/trips': MapPin,
  '/dashboard/trips/active': MapPin,
  '/dashboard/trips/completed': CheckSquare,
  '/dashboard/fuel-logging': Fuel,
  '/dashboard/safety/compliance': ShieldCheck,
};

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, allowed: Permissions.NAV.dashboard },
  { href: '/dashboard/vehicles', label: 'Vehicle Registry', icon: Truck, allowed: Permissions.NAV.vehicles },
  { href: '/dashboard/drivers', label: 'Drivers', icon: User, allowed: Permissions.NAV.drivers },
  { href: '/dashboard/trips', label: 'Trip Dispatcher', icon: MapPin, allowed: Permissions.NAV.trips },
  { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, allowed: Permissions.NAV.maintenance },
  { href: '/dashboard/trips/completed', label: 'Completed Trips', icon: CheckSquare, allowed: Permissions.NAV.completed },
  { href: '/dashboard/fuel-logs', label: 'Fuel & Expense', icon: Fuel, allowed: Permissions.FUEL_LOGS.view },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, allowed: Permissions.NAV.analytics },
  { href: '/dashboard/map', label: 'Live Map', icon: Map, allowed: Permissions.NAV.map },
  { href: '/dashboard/ai-chat', label: 'AI Assistant', icon: MessageSquare, allowed: Permissions.NAV.aiChat },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isManager = user?.role === ROLES.Manager;
  const isDispatcher = user?.role === ROLES.Dispatcher;
  const isSafetyOfficer = user?.role === ROLES.SafetyOfficer;
  const isFinancialAnalyst = user?.role === ROLES.FinancialAnalyst;

  const navItems = isManager
    ? [
        ...MANAGER_NAV.map((item) => ({
          href: item.href,
          label: item.label,
          icon: iconByPath[item.href] ?? LayoutDashboard,
        })),
        ...COMMUNITY_NAV.map((item) => ({
          href: item.href,
          label: item.label,
          icon: iconByPath[item.href] ?? Users,
        })),
      ]
    : isDispatcher
      ? DISPATCHER_NAV.map((item) => ({
          href: item.href,
          label: item.label,
          icon: iconByPath[item.href] ?? LayoutDashboard,
        }))
      : isSafetyOfficer
        ? SAFETY_OFFICER_NAV.map((item) => ({
            href: item.href,
            label: item.label,
            icon: iconByPath[item.href] ?? LayoutDashboard,
          }))
        : nav
            .filter((item) => can(user?.role, item.allowed))
            .map((item) => ({ href: item.href, label: item.label, icon: item.icon }));

  return (
    <aside className="glass fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-teal-200">
      <div className="flex h-14 flex-col justify-center gap-0 border-b border-teal-200 px-4">
        <span className="font-semibold neon-text">FleetFlow AI</span>
        {user?.communityName && (
          <span className="truncate text-xs text-zinc-600">{user.communityName}</span>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? 'bg-teal-100 text-teal-800'
                  : 'text-zinc-600 hover:bg-slate-100 hover:text-zinc-900'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {!isManager && !isDispatcher && !isSafetyOfficer && (isFinancialAnalyst || can(user?.role, Permissions.NAV.export)) && (
          <Link
            href="/dashboard/export"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 hover:bg-slate-100 hover:text-zinc-900"
          >
            <FileDown className="h-5 w-5" />
            Export
          </Link>
        )}
      </nav>
      <div className="border-t border-teal-200 p-3">
        <p className="truncate text-xs text-zinc-600">{user?.email}</p>
        <p className="text-xs font-medium text-teal-700">{user?.role}</p>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
