'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trips as tripsApi, type Trip } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';
import { Send, CheckCircle, XCircle, MapPin, Copy, CheckCheck } from 'lucide-react';
import { LiveMapModal } from '@/components/LiveMapModal';

export default function ActiveTripsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeModal, setCompleteModal] = useState<{ trip: Trip } | null>(null);
  const [completeForm, setCompleteForm] = useState({ fuelUsed: '', cost: '', endOdometer: '' });
  const [error, setError] = useState('');
  const [mapTripId, setMapTripId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canManage = can(user?.role, Permissions.TRIPS.dispatch) || can(user?.role, Permissions.TRIPS.complete);

  const loadTrips = useCallback(async () => {
    const res = await tripsApi.list();
    const list = Array.isArray(res.data) ? res.data : [];
    setTrips(list.filter((t) => t.status === 'Draft' || t.status === 'Dispatched'));
  }, []);

  useEffect(() => {
    if (!can(user?.role, Permissions.NAV.trips)) {
      router.replace('/dashboard/access-denied');
      return;
    }
    loadTrips().finally(() => setLoading(false));
  }, [user?.role, router, loadTrips]);

  const handleDispatch = async (id: string) => {
    setError('');
    try {
      await tripsApi.dispatch(id);
      await loadTrips();
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
      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Complete failed');
    }
  };

  const handleCancel = async (id: string) => {
    setError('');
    try {
      await tripsApi.cancel(id);
      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  const copyShareLink = (token: string, tripId: string) => {
    const url = `${window.location.origin}/driver-trip/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(tripId);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const driverRespBadge = (resp?: string) => {
    if (!resp || resp === 'Pending') return <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-600">Pending</span>;
    if (resp === 'Accepted') return <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">✓ Accepted</span>;
    return <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">✗ Rejected</span>;
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
          <p className="mt-1 text-[#64748B]">Manage dispatched trips and monitor driver locations in real-time</p>
        </div>
        <Link href="/dashboard/trips" className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#2563EB] hover:bg-[#F1F5F9] transition-colors">
          + New Trip
        </Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">{error}</p>}

      {/* Cards layout for richer trip info */}
      {trips.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white py-16 text-center text-[#64748B]">
          <MapPin className="mx-auto h-10 w-10 mb-3 text-[#CBD5E1]" />
          <p className="font-medium">No active trips</p>
          <p className="text-sm mt-1">Dispatch a new trip from the Trip Dispatcher page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((t) => {
            const vehicle = t.vehicleId as { name?: string; licensePlate?: string };
            const driver = t.driverId as { name?: string };
            const isDispatched = t.status === 'Dispatched';
            const driverAccepted = t.driverResponse === 'Accepted';

            return (
              <div
                key={t._id}
                className={`rounded-xl border bg-white shadow-sm transition-all ${isDispatched ? 'border-blue-200' : 'border-[#E2E8F0]'}`}
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Trip info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#0F172A]">{vehicle?.name ?? '—'}</p>
                      <span className="text-[#94A3B8]">→</span>
                      <p className="font-medium text-[#2563EB]">{driver?.name ?? '—'}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isDispatched ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>{t.status}</span>
                      {isDispatched && driverRespBadge(t.driverResponse)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
                      <span>{t.cargoWeight} kg cargo</span>
                      <span>{t.distance} km</span>
                      {vehicle?.licensePlate && <span>{vehicle.licensePlate}</span>}
                      {t.pickupLocation?.address && <span>📍 {t.pickupLocation.address}</span>}
                    </div>
                    {t.lastLocationAt && (
                      <p className="text-xs text-green-600">
                        Last GPS ping: {new Date(t.lastLocationAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {/* Live Location button — only for accepted dispatched trips */}
                    {isDispatched && driverAccepted && (
                      <button
                        onClick={() => setMapTripId(t._id)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                        </span>
                        View Live Location
                      </button>
                    )}

                    {/* Share link button for dispatched trips */}
                    {isDispatched && t.shareToken && (
                      <button
                        onClick={() => copyShareLink(t.shareToken!, t._id)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
                        title="Copy driver share link"
                      >
                        {copiedId === t._id ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedId === t._id ? 'Copied!' : 'Driver Link'}
                      </button>
                    )}

                    {canManage && t.status === 'Draft' && (
                      <>
                        <button onClick={() => handleDispatch(t._id)} className="flex items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-colors">
                          <Send className="h-3.5 w-3.5" /> Dispatch
                        </button>
                        <button onClick={() => handleCancel(t._id)} className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 hover:bg-red-100 transition-colors">
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </>
                    )}
                    {canManage && isDispatched && (
                      <button onClick={() => setCompleteModal({ trip: t })} className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors">
                        <CheckCircle className="h-3.5 w-3.5" /> Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Map Modal */}
      {mapTripId && (
        <LiveMapModal tripId={mapTripId} onClose={() => setMapTripId(null)} />
      )}

      {/* Complete Trip Modal */}
      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] shadow-card w-full max-w-sm rounded-xl p-6">
            <h3 className="font-semibold text-[#0F172A]">Complete Trip</h3>
            <p className="mt-1 text-sm text-[#64748B]">Enter final odometer and fuel details</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-[#64748B]">Final odometer (km)</label>
                <input type="number" min={0} placeholder="Optional" value={completeForm.endOdometer} onChange={(e) => setCompleteForm((f) => ({ ...f, endOdometer: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] placeholder-[#94A3B8]" />
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
              <button onClick={() => setCompleteModal(null)} className="flex-1 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] py-2 text-[#0F172A] hover:bg-[#E2E8F0]">Cancel</button>
              <button onClick={handleComplete} className="flex-1 rounded-lg bg-[#2563EB] py-2 font-medium text-white hover:bg-[#1D4ED8]">Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
