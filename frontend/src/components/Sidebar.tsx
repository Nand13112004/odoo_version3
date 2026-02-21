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
} from 'lucide-react';
import { Permissions, can } from '@/lib/permissions';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, allowed: Permissions.NAV.dashboard },
  { href: '/dashboard/vehicles', label: 'Vehicle Registry', icon: Truck, allowed: Permissions.NAV.vehicles },
  { href: '/dashboard/drivers', label: 'Drivers', icon: User, allowed: Permissions.NAV.drivers },
  { href: '/dashboard/trips', label: 'Trip Dispatcher', icon: MapPin, allowed: Permissions.NAV.trips },
  { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, allowed: Permissions.NAV.maintenance },
  { href: '/dashboard/trips/completed', label: 'Completed Trips', icon: CheckSquare, allowed: Permissions.NAV.completed },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, allowed: Permissions.NAV.analytics },
  { href: '/dashboard/map', label: 'Live Map', icon: Map, allowed: Permissions.NAV.map },
  { href: '/dashboard/ai-chat', label: 'AI Assistant', icon: MessageSquare, allowed: Permissions.NAV.aiChat },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="glass fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-[#00ffc8]/10">
      <div className="flex h-14 items-center gap-2 border-b border-[#00ffc8]/10 px-4">
        <span className="font-semibold neon-text">FleetFlow AI</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {nav.map((item) => {
          const Icon = item.icon;
          // respect frontend visibility via role
          if (!can(user?.role, item.allowed)) return null;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? 'bg-[#00ffc8]/15 text-[#00ffc8]'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/dashboard/export"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
        >
          <FileDown className="h-5 w-5" />
          Export
        </Link>
      </nav>
      <div className="border-t border-[#00ffc8]/10 p-3">
        <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        <p className="text-xs font-medium text-[#00ffc8]/80">{user?.role}</p>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
