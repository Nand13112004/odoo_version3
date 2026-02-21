'use client';

import { useEffect, useState } from 'react';
import { drivers as driversApi, type Driver } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  'On Duty': 'bg-emerald-500/20 text-emerald-400',
  'Off Duty': 'bg-zinc-500/20 text-zinc-400',
  'On Trip': 'bg-blue-500/20 text-blue-400',
  Suspended: 'bg-red-500/20 text-red-400',
};

export default function DriversPage() {
  const [list, setList] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversApi.list().then((r) => { if (r.success && r.data) setList(Array.isArray(r.data) ? r.data : []); }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-zinc-800/50" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold neon-text">Driver Management</h1>
      <p className="mt-1 text-zinc-400">Licenses and status</p>
      <div className="mt-6 glass neon-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-900/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">License</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Expiry</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Safety</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => {
              const expired = d.licenseExpiry && new Date(d.licenseExpiry) < new Date();
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
                  <td className="px-4 py-3 text-zinc-300">{d.safetyScore ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[d.status] || 'bg-zinc-500/20 text-zinc-400'}`}>
                      {d.status}
                    </span>
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
