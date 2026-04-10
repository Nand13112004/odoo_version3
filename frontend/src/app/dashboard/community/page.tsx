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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold neon-text">Community Dashboard</h1>
        <p className="mt-1 text-[#64748B]">Overview of your community</p>
      </div>

      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#64748B]">Total Members</p>
              <p className="mt-1 text-2xl font-bold text-[#0F172A]">{dashboard?.totalMembers ?? 0}</p>
            </div>
            <Users className="h-10 w-10 text-[#2563EB]" />
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#64748B]">Total Vehicles</p>
              <p className="mt-1 text-2xl font-bold text-[#0F172A]">{dashboard?.totalVehicles ?? 0}</p>
            </div>
            <Truck className="h-10 w-10 text-[#2563EB]" />
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#64748B]">Total Drivers</p>
              <p className="mt-1 text-2xl font-bold text-[#0F172A]">{dashboard?.totalDrivers ?? 0}</p>
            </div>
            <User className="h-10 w-10 text-[#2563EB]" />
          </div>
        </div>
      </div>

      {dashboard?.roleCounts && Object.keys(dashboard.roleCounts).length > 0 && (
        <div className="bg-white border border-[#E2E8F0] shadow-card mb-8 rounded-xl p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">Role Distribution</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(dashboard.roleCounts).map(([role, count]) => (
              <span key={role} className="rounded-lg bg-teal-100 px-3 py-1.5 text-sm text-teal-800">
                {role}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/community/settings" className="flex items-center gap-2 rounded-lg bg-[#F1F5F9] px-4 py-2 text-[#0F172A] hover:bg-[#E2E8F0]">
          <Settings className="h-4 w-4" />
          Community Settings
        </Link>
        <Link href="/dashboard/community/invite" className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-[#0F172A] hover:bg-[#F1F5F9]">
          Invite Members
        </Link>
        <Link href="/dashboard/community/members" className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-[#2563EB] hover:bg-[#F1F5F9]">
          View Members
        </Link>
      </div>
    </div>
  );
}
