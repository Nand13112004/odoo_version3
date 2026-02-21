'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { drivers as driversApi, type Driver } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';
import { AlertCircle, UserX } from 'lucide-react';

export default function SafetyCompliancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== ROLES.SafetyOfficer) {
      router.replace('/dashboard/access-denied');
      return;
    }
    driversApi.list().then((r) => {
      if (r.success && r.data) setList(Array.isArray(r.data) ? r.data : []);
    }).finally(() => setLoading(false));
  }, [user?.role, router]);

  const expired = list.filter((d) => d.licenseExpiry && new Date(d.licenseExpiry) < new Date());
  const expiringSoon = list.filter((d) => {
    if (!d.licenseExpiry) return false;
    const exp = new Date(d.licenseExpiry);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return exp >= new Date() && exp <= in30;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-zinc-800/50" />
      </div>
    );
  }

  if (user?.role !== ROLES.SafetyOfficer) return null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold neon-text">Compliance Monitoring</h1>
        <p className="mt-1 text-zinc-400">Track license expiry, flag expired drivers. Expired drivers are blocked from dispatcher assignment.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="glass neon-border rounded-lg p-4 flex items-center gap-3">
          <UserX className="h-8 w-8 text-red-400/70" />
          <div>
            <p className="text-xs text-zinc-400">Expired licenses</p>
            <p className="text-xl font-bold text-white">{expired.length}</p>
            <p className="text-xs text-zinc-500">Auto-set to Suspended; hidden from dispatch pool</p>
          </div>
        </div>
        <div className="glass neon-border rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-amber-400/70" />
          <div>
            <p className="text-xs text-zinc-400">Expiring in 30 days</p>
            <p className="text-xl font-bold text-white">{expiringSoon.length}</p>
          </div>
        </div>
      </div>

      <div className="glass neon-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-900/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">License</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Expiry</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Flag</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => {
              const isExpired = d.licenseExpiry && new Date(d.licenseExpiry) < new Date();
              return (
                <tr key={d._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{d.licenseNumber}</td>
                  <td className="px-4 py-3">
                    <span className={isExpired ? 'text-red-400' : 'text-zinc-300'}>
                      {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '–'}
                      {isExpired && <AlertCircle className="ml-1 inline h-4 w-4 text-red-400" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                      d.status === 'Suspended' ? 'bg-red-500/20 text-red-400' :
                      d.status === 'On Duty' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'
                    }`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isExpired ? <span className="text-red-400">Expired – blocked from dispatch</span> : '–'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <div className="py-12 text-center text-zinc-500">No drivers</div>}
      </div>
    </div>
  );
}
