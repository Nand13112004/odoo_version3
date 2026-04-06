'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trips as tripsApi, type Trip } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';
import { Send, CheckCircle, XCircle } from 'lucide-react';

export default function ActiveTripsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeModal, setCompleteModal] = useState<{ trip: Trip } | null>(null);
  const [completeForm, setCompleteForm] = useState({ fuelUsed: '', cost: '', endOdometer: '' });
  const [error, setError] = useState('');

  const canManage = can(user?.role, Permissions.TRIPS.dispatch) || can(user?.role, Permissions.TRIPS.complete);

  useEffect(() => {
    if (!can(user?.role, Permissions.NAV.trips)) {
      router.replace('/dashboard/access-denied');
      return;
    }
    tripsApi.list().then((r) => {
      const list = Array.isArray(r.data) ? r.data : [];
      setTrips(list.filter((t) => t.status === 'Draft' || t.status === 'Dispatched'));
    }).finally(() => setLoading(false));
  }, [user?.role, router]);

  const handleDispatch = async (id: string) => {
    setError('');
    try {
      await tripsApi.dispatch(id);
      const res = await tripsApi.list();
      setTrips((Array.isArray(res.data) ? res.data : []).filter((t) => t.status === 'Draft' || t.status === 'Dispatched'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dispatch failed');
    }
  };

  const handleComplete = async () => {
    if (!completeModal) return;
    setError('');
    try {
      await tripsApi.complete(completeModal.trip._id, {
        fuelUsed: Number(completeForm.fuelUsed) || 0,
        cost: Number(completeForm.cost) || 0,
        endOdometer: completeForm.endOdometer ? Number(completeForm.endOdometer) : undefined,
      });
      setCompleteModal(null);
      setCompleteForm({ fuelUsed: '', cost: '', endOdometer: '' });
      const res = await tripsApi.list();
      setTrips((Array.isArray(res.data) ? res.data : []).filter((t) => t.status === 'Draft' || t.status === 'Dispatched'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Complete failed');
    }
  };

  const handleCancel = async (id: string) => {
    setError('');
    try {
      await tripsApi.cancel(id);
      const res = await tripsApi.list();
      setTrips((Array.isArray(res.data) ? res.data : []).filter((t) => t.status === 'Draft' || t.status === 'Dispatched'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#E2E8F0]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">Active Trips</h1>
          <p className="mt-1 text-[#64748B]">View ongoing trips and update status (Draft → Dispatched → Completed / Cancelled)</p>
        </div>
        <Link href="/dashboard/trips" className="text-sm font-medium text-[#2563EB] hover:underline">Trip Dispatcher</Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Driver</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Cargo (kg)</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Distance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Status</th>
              {canManage && <th className="px-4 py-3 text-left text-sm font-medium text-[#64748B]">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t._id} className="border-b border-[#E2E8F0] hover:bg-[#F1F5F9]">
                <td className="px-4 py-3 text-[#0F172A]">{(t.vehicleId as { name?: string })?.name ?? '-'}</td>
                <td className="px-4 py-3 text-[#2563EB]">{(t.driverId as { name?: string })?.name ?? '-'}</td>
                <td className="px-4 py-3 text-[#2563EB]">{t.cargoWeight}</td>
                <td className="px-4 py-3 text-[#2563EB]">{t.distance} km</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                    t.status === 'Dispatched' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-500/20 text-[#64748B]'
                  }`}>{t.status}</span>
                </td>
                {canManage && (
                  <td className="px-4 py-3 flex gap-2">
                    {t.status === 'Draft' && (
                      <>
                        <button onClick={() => handleDispatch(t._id)} className="inline-flex items-center gap-1 rounded bg-[#2563EB] px-2 py-1 text-xs font-medium text-[#0F172A] hover:bg-[#1D4ED8]">
                          <Send className="h-3 w-3" /> Dispatch
                        </button>
                        <button onClick={() => handleCancel(t._id)} className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30">
                          <XCircle className="h-3 w-3" /> Cancel
                        </button>
                      </>
                    )}
                    {t.status === 'Dispatched' && (
                      <button onClick={() => setCompleteModal({ trip: t })} className="inline-flex items-center gap-1 rounded bg-[#2563EB] px-2 py-1 text-xs font-medium text-[#0F172A] hover:bg-[#1D4ED8]">
                        <CheckCircle className="h-3 w-3" /> Complete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {trips.length === 0 && <div className="py-12 text-center text-[#64748B]">No active trips</div>}
      </div>

      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] shadow-card w-full max-w-sm rounded-xl p-6">
            <h3 className="font-semibold text-[#0F172A]">Complete Trip</h3>
            <p className="mt-1 text-sm text-[#64748B]">Enter final odometer and fuel details</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-[#64748B]">Final odometer (km)</label>
                <input type="number" min={0} placeholder="Optional" value={completeForm.endOdometer} onChange={(e) => setCompleteForm((f) => ({ ...f, endOdometer: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] placeholder-zinc-500" />
              </div>
              <div>
                <label className="block text-sm text-[#64748B]">Fuel used (L)</label>
                <input type="number" min={0} value={completeForm.fuelUsed} onChange={(e) => setCompleteForm((f) => ({ ...f, fuelUsed: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]" />
              </div>
              <div>
                <label className="block text-sm text-[#64748B]">Cost ($)</label>
                <input type="number" min={0} value={completeForm.cost} onChange={(e) => setCompleteForm((f) => ({ ...f, cost: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setCompleteModal(null)} className="flex-1 rounded-lg border border-[#E2E8F0] py-2 text-[#2563EB] hover:bg-[#F1F5F9]">Cancel</button>
              <button onClick={handleComplete} className="flex-1 rounded-lg bg-[#2563EB]/20 py-2 text-[#2563EB] hover:bg-[#2563EB]/30">Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
