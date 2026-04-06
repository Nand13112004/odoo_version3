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
        <div className="h-64 animate-pulse rounded-xl bg-[#E2E8F0]" />
      </div>
    );
  }

  if (user?.role !== ROLES.SafetyOfficer) return null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold neon-text">Compliance Monitoring</h1>
        <p className="mt-1 text-[#64748B]">Track license expiry, flag expired drivers. Expired drivers are blocked from dispatcher assignment.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4 flex items-center gap-3">
          <UserX className="h-8 w-8 text-red-500/70" />
          <div>
            <p className="text-xs text-[#64748B]">Expired licenses</p>
            <p className="text-xl font-bold text-[#0F172A]">{expired.length}</p>
            <p className="text-xs text-[#64748B]">Auto-set to Suspended; hidden from dispatch pool</p>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-amber-400/70" />
          <div>
            <p className="text-xs text-[#64748B]">Expiring in 30 days</p>
            <p className="text-xl font-bold text-[#0F172A]">{expiringSoon.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">License</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Expiry</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Flag</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => {
              const isExpired = d.licenseExpiry && new Date(d.licenseExpiry) < new Date();
              return (
                <tr key={d._id} className="border-b border-[#E2E8F0] hover:bg-[#F1F5F9]">
                  <td className="px-4 py-3 font-medium text-[#0F172A]">{d.name}</td>
                  <td className="px-4 py-3 text-[#475569]">{d.licenseNumber}</td>
                  <td className="px-4 py-3">
                    <span className={isExpired ? 'text-red-500' : 'text-[#475569]'}>
                      {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '–'}
                      {isExpired && <AlertCircle className="ml-1 inline h-4 w-4 text-red-500" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                      d.status === 'Suspended' ? 'bg-red-500/20 text-red-500' :
                      d.status === 'On Duty' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#E2E8F0] text-[#2563EB]'
                    }`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isExpired ? <span className="text-red-500">Expired – blocked from dispatch</span> : '–'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <div className="py-12 text-center text-[#64748B]">No drivers</div>}
      </div>
    </div>
  );
}
