'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { drivers as driversApi, type Driver } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions, ROLES } from '@/lib/permissions';
import { AlertCircle, UserX } from 'lucide-react';

const statusColors: Record<string, string> = {
  'On Duty': 'bg-emerald-500/20 text-emerald-400',
  'Off Duty': 'bg-zinc-500/20 text-zinc-400',
  'On Trip': 'bg-blue-500/20 text-blue-400',
  Suspended: 'bg-red-500/20 text-red-400',
};

const STATUS_OPTIONS = ['On Duty', 'Off Duty', 'Suspended', 'On Trip'] as const;

export default function DriverCompliancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canAccess = user?.role === ROLES.Manager || can(user?.role, Permissions.DRIVERS.updateStatus);

  useEffect(() => {
    if (!canAccess) {
      router.replace('/dashboard/access-denied');
      return;
    }
    driversApi.list().then((r) => {
      if (r.success && r.data) setList(Array.isArray(r.data) ? r.data : []);
    }).finally(() => setLoading(false));
  }, [canAccess, router]);

  const handleStatusChange = async (driverId: string, status: string) => {
    setUpdatingId(driverId);
    try {
      await driversApi.updateStatus(driverId, status);
      const res = await driversApi.list();
      if (res.success && res.data) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status (e.g. license expired)');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-zinc-800/50" />
      </div>
    );
  }

  if (!canAccess) return null;

  const expiredDrivers = list.filter((d) => d.licenseExpiry && new Date(d.licenseExpiry) < new Date());
  const expiringSoon = list.filter((d) => {
    if (!d.licenseExpiry) return false;
    const exp = new Date(d.licenseExpiry);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return exp >= new Date() && exp <= in30;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold neon-text">Driver Compliance</h1>
        <p className="mt-1 text-zinc-400">License expiry, block expired drivers, toggle On Duty / Off Duty / Suspended</p>
      </div>

      {(expiredDrivers.length > 0 || expiringSoon.length > 0) && (
        <div className="mb-6 space-y-3">
          {expiredDrivers.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <UserX className="h-5 w-5 text-red-400" />
              <div>
                <p className="font-medium text-red-300">Expired licenses ({expiredDrivers.length})</p>
                <p className="text-sm text-red-200/80">These drivers are blocked from duty until license is updated.</p>
              </div>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <p className="font-medium text-amber-200">Expiring in 30 days: {expiringSoon.length} driver(s)</p>
            </div>
          )}
        </div>
      )}

      <div className="glass neon-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-900/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">License</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Expiry</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => {
              const expired = d.licenseExpiry && new Date(d.licenseExpiry) < new Date();
              const canSetDuty = !expired || (d.status !== 'On Duty' && d.status !== 'On Trip');
              return (
                <tr key={d._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{d.licenseNumber}</td>
                  <td className="px-4 py-3">
                    <span className={expired ? 'text-red-400' : 'text-zinc-300'}>
                      {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '-'}
                      {expired && <AlertCircle className="ml-1 inline h-4 w-4 text-red-400" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[d.status] || 'bg-zinc-500/20 text-zinc-400'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={d.status}
                      disabled={updatingId === d._id || (expired && (d.status === 'On Duty' || d.status === 'On Trip'))}
                      onChange={(e) => handleStatusChange(d._id, e.target.value)}
                      className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-white disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {expired && (d.status === 'On Duty' || d.status === 'On Trip') && (
                      <span className="ml-2 text-xs text-red-400">(blocked – expired)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="py-12 text-center text-zinc-500">No drivers</div>
        )}
      </div>
    </div>
  );
}
