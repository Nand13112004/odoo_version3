'use client';

import { useEffect, useState } from 'react';
import { trips as tripsApi, vehicles as vehiclesApi, drivers as driversApi, type Trip, type Vehicle, type Driver } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Permissions, can, ROLES } from '@/lib/permissions';
import { MapPin, Send, X, Loader2, Copy, CheckCheck, ChevronDown } from 'lucide-react';

export default function TripDispatcherPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    distance: '',
    revenue: '',
    locationUrl: '',
    pickupAddress: '',
    dropAddress: '',
    dispatcherNotes: '',
  });
  const [error, setError] = useState('');
  const [completeModal, setCompleteModal] = useState<{ trip: Trip } | null>(null);
  const [completeForm, setCompleteForm] = useState({ fuelUsed: '', cost: '', endOdometer: '' });
  // Share link state: { tripId, url } for the most recently dispatched trip
  const [shareLink, setShareLink] = useState<{ tripId: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    Promise.all([
      tripsApi.list().then((r) => (Array.isArray(r.data) ? r.data : []) as Trip[]),
      vehiclesApi.list().then((r) => (Array.isArray(r.data) ? r.data : []) as Vehicle[]),
      driversApi.list().then((r) => (Array.isArray(r.data) ? r.data : []) as Driver[]),
    ]).then(([t, v, d]) => {
      setTrips(t);
      setVehicles(v);
      setDrivers(d);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  const availableDrivers = drivers
    .filter((d) => (user?.role === ROLES.Dispatcher ? d.status === 'On Duty' : (d.status === 'On Duty' || d.status === 'Off Duty')))
    .filter((d) => !d.licenseExpiry || new Date(d.licenseExpiry) >= new Date());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const vehicle = vehicles.find((v) => v._id === form.vehicleId);
      if (vehicle && Number(form.cargoWeight) > vehicle.capacity) {
        setError('Cargo exceeds vehicle capacity');
        return;
      }
      await tripsApi.create({
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        cargoWeight: Number(form.cargoWeight),
        distance: Number(form.distance),
        revenue: Number(form.revenue) || 0,
        locationUrl: form.locationUrl || undefined,
        pickupLocation: form.pickupAddress ? { address: form.pickupAddress } : undefined,
        dropLocation: form.dropAddress ? { address: form.dropAddress } : undefined,
        dispatcherNotes: form.dispatcherNotes || undefined,
      } as Partial<Trip>);
      setForm({ vehicleId: '', driverId: '', cargoWeight: '', distance: '', revenue: '', locationUrl: '', pickupAddress: '', dropAddress: '', dispatcherNotes: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setCreating(false);
    }
  };

  const handleDispatch = async (id: string) => {
    try {
      const res = await tripsApi.dispatch(id);
      // Extract share link from response
      if (res.data?.shareLink) {
        setShareLink({ tripId: id, url: res.data.shareLink });
        setCopied(false);
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dispatch failed');
    }
  };

  const handleComplete = async () => {
    if (!completeModal) return;
    try {
      await tripsApi.complete(completeModal.trip._id, {
        fuelUsed: Number(completeForm.fuelUsed) || 0,
        cost: Number(completeForm.cost) || 0,
        endOdometer: completeForm.endOdometer ? Number(completeForm.endOdometer) : undefined,
      });
      setCompleteModal(null);
      setCompleteForm({ fuelUsed: '', cost: '', endOdometer: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Complete failed');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await tripsApi.cancel(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  const copyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const draftOrDispatched = trips.filter((t) => t.status === 'Draft' || t.status === 'Dispatched');
  const inputCls = 'mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30';

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#E2E8F0]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold neon-text">Trip Dispatcher</h1>
      <p className="mt-1 text-[#64748B]">Create and dispatch trips to drivers</p>
      {error && <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">{error}</p>}

      {/* Share Link Banner */}
      {shareLink && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-700 mb-0.5">✅ Trip Dispatched — Share this link with the driver:</p>
            <p className="truncate text-sm text-blue-600 font-mono">{shareLink.url}</p>
          </div>
          <button
            onClick={copyShareLink}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={() => setShareLink(null)} className="shrink-0 text-blue-400 hover:text-blue-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {can(user?.role, Permissions.ACTIONS.assignTrip) && (
          <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-4 sm:p-5">
            <h2 className="mb-4 font-semibold text-[#0F172A]">New Trip</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              {/* Vehicle */}
              <div>
                <label className="block text-sm text-[#64748B]">Vehicle</label>
                <div className="relative">
                  <select value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} className={inputCls + ' appearance-none pr-8'} required>
                    <option value="">Select vehicle</option>
                    {availableVehicles.map((v) => (
                      <option key={v._id} value={v._id}>{v.name} ({v.licensePlate}) – cap {v.capacity} kg</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                </div>
              </div>
              {/* Driver */}
              <div>
                <label className="block text-sm text-[#64748B]">Driver</label>
                <div className="relative">
                  <select value={form.driverId} onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))} className={inputCls + ' appearance-none pr-8'} required>
                    <option value="">Select driver</option>
                    {availableDrivers.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                </div>
              </div>
              {/* Pickup & Drop */}
              <div>
                <label className="block text-sm text-[#64748B]">Pickup Location</label>
                <input type="text" placeholder="e.g. Mumbai Warehouse, Andheri" value={form.pickupAddress} onChange={(e) => setForm((f) => ({ ...f, pickupAddress: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-[#64748B]">Drop Location</label>
                <input type="text" placeholder="e.g. Pune Distribution Centre" value={form.dropAddress} onChange={(e) => setForm((f) => ({ ...f, dropAddress: e.target.value }))} className={inputCls} />
              </div>
              {/* Cargo, Distance, Revenue */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-[#64748B]">Cargo (kg)</label>
                  <input type="number" min={0} value={form.cargoWeight} onChange={(e) => setForm((f) => ({ ...f, cargoWeight: e.target.value }))} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-sm text-[#64748B]">Distance (km)</label>
                  <input type="number" min={0} value={form.distance} onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-sm text-[#64748B]">Revenue ($)</label>
                  <input type="number" min={0} value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} className={inputCls} />
                </div>
              </div>
              {/* Dispatcher Notes */}
              <div>
                <label className="block text-sm text-[#64748B]">Dispatcher Notes <span className="text-[#94A3B8]">(optional)</span></label>
                <textarea rows={2} placeholder="Any special instructions for the driver…" value={form.dispatcherNotes} onChange={(e) => setForm((f) => ({ ...f, dispatcherNotes: e.target.value }))} className={inputCls + ' resize-none'} />
              </div>
              {/* Location URL */}
              <div>
                <label className="block text-sm text-[#64748B]">Route Link <span className="text-[#94A3B8]">(Google Maps)</span></label>
                <input type="url" placeholder="https://maps.app.goo.gl/..." value={form.locationUrl} onChange={(e) => setForm((f) => ({ ...f, locationUrl: e.target.value }))} className={inputCls} />
              </div>
              <button type="submit" disabled={creating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-2.5 font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                Create Trip
              </button>
            </form>
          </div>
        )}

        {/* Active / Draft Trips list */}
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-4 sm:p-5">
          <h2 className="mb-4 font-semibold text-[#0F172A]">Active / Draft Trips</h2>
          <ul className="space-y-3">
            {draftOrDispatched.map((t) => {
              const driverResp = t.driverResponse;
              const respColor = driverResp === 'Accepted' ? 'text-green-600 bg-green-50 border-green-200'
                : driverResp === 'Rejected' ? 'text-red-600 bg-red-50 border-red-200'
                : 'text-yellow-600 bg-yellow-50 border-yellow-200';
              return (
                <li key={t._id} className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#0F172A] text-sm">
                        {(t.vehicleId as { name?: string })?.name} → {(t.driverId as { name?: string })?.name}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">{t.cargoWeight} kg · {t.distance} km · {t.status}</p>
                      {t.pickupLocation?.address && <p className="text-xs text-[#64748B] mt-0.5">📍 {t.pickupLocation.address}</p>}
                    </div>
                    {driverResp && t.status === 'Dispatched' && (
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${respColor}`}>
                        {driverResp}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {can(user?.role, Permissions.ACTIONS.assignTrip) && t.status === 'Draft' && (
                      <>
                        <button onClick={() => handleDispatch(t._id)} className="rounded bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8] flex items-center gap-1">
                          <Send className="h-3 w-3" /> Dispatch
                        </button>
                        <button onClick={() => handleCancel(t._id)} className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100">Cancel</button>
                      </>
                    )}
                    {can(user?.role, Permissions.ACTIONS.assignTrip) && t.status === 'Dispatched' && (
                      <>
                        <button onClick={() => setCompleteModal({ trip: t })} className="rounded bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8] flex items-center gap-1">
                          Complete
                        </button>
                        {t.shareToken && (
                          <button
                            onClick={() => { setShareLink({ tripId: t._id, url: `${window.location.origin}/driver-trip/${t.shareToken}` }); setCopied(false); }}
                            className="rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" /> Share Link
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {draftOrDispatched.length === 0 && <p className="text-sm text-[#64748B]">No draft or active trips</p>}
          </ul>
        </div>
      </div>

      {/* Complete Modal */}
      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E8F0] shadow-card w-full max-w-sm rounded-xl p-5 sm:p-6">
            <h3 className="font-semibold text-[#0F172A]">Complete Trip</h3>
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
