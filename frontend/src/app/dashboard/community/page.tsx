'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { community } from '@/lib/api';
import { ROLES } from '@/lib/permissions';
import { Users, Truck, User, Settings } from 'lucide-react';
import Link from 'next/link';

interface CommunityDashboard {
  community: { _id: string; name: string };
  totalMembers: number;
  roleCounts: Record<string, number>;
  totalVehicles: number;
  totalDrivers: number;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<CommunityDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== ROLES.Manager) return;
    community.getDashboard().then((r) => {
      if (r.success && r.data) setDashboard(r.data as CommunityDashboard);
      setLoading(false);
    });
  }, [user?.role]);

  if (user?.role !== ROLES.Manager) return null;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00ffc8] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold neon-text">Community Dashboard</h1>
        <p className="mt-1 text-zinc-400">Overview of your community</p>
      </div>

      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass neon-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Members</p>
              <p className="mt-1 text-2xl font-bold text-white">{dashboard?.totalMembers ?? 0}</p>
            </div>
            <Users className="h-10 w-10 text-[#00ffc8]/60" />
          </div>
        </div>
        <div className="glass neon-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Vehicles</p>
              <p className="mt-1 text-2xl font-bold text-white">{dashboard?.totalVehicles ?? 0}</p>
            </div>
            <Truck className="h-10 w-10 text-[#00ffc8]/60" />
          </div>
        </div>
        <div className="glass neon-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Drivers</p>
              <p className="mt-1 text-2xl font-bold text-white">{dashboard?.totalDrivers ?? 0}</p>
            </div>
            <User className="h-10 w-10 text-[#00ffc8]/60" />
          </div>
        </div>
      </div>

      {dashboard?.roleCounts && Object.keys(dashboard.roleCounts).length > 0 && (
        <div className="glass neon-border mb-8 rounded-xl p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Role Distribution</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(dashboard.roleCounts).map(([role, count]) => (
              <span key={role} className="rounded-lg bg-[#00ffc8]/10 px-3 py-1.5 text-sm text-[#00ffc8]">
                {role}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/community/settings" className="flex items-center gap-2 rounded-lg bg-[#00ffc8]/20 px-4 py-2 text-[#00ffc8] hover:bg-[#00ffc8]/30">
          <Settings className="h-4 w-4" />
          Community Settings
        </Link>
        <Link href="/dashboard/community/invite" className="flex items-center gap-2 rounded-lg border border-[#00ffc8]/30 px-4 py-2 text-[#00ffc8] hover:bg-[#00ffc8]/10">
          Invite Members
        </Link>
        <Link href="/dashboard/community/members" className="flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-zinc-300 hover:bg-zinc-800/50">
          View Members
        </Link>
      </div>
    </div>
  );
}
