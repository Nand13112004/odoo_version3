'use client';

import { useEffect, useState } from 'react';
import { trips as tripsApi, vehicles as vehiclesApi, drivers as driversApi, type Trip, type Vehicle, type Driver } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Permissions, can, ROLES } from '@/lib/permissions';
import { MapPin, Send, X, Loader2 } from 'lucide-react';

export default function TripDispatcherPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', driverId: '', cargoWeight: '', distance: '', revenue: '', locationUrl: '' });
  const [error, setError] = useState('');
  const [completeModal, setCompleteModal] = useState<{ trip: Trip } | null>(null);
  const [completeForm, setCompleteForm] = useState({ fuelUsed: '', cost: '', endOdometer: '' });

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
      });
      setForm({ vehicleId: '', driverId: '', cargoWeight: '', distance: '', revenue: '', locationUrl: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setCreating(false);
    }
  };

  const handleDispatch = async (id: string) => {
    try {
      await tripsApi.dispatch(id);
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

  const draftOrDispatched = trips.filter((t) => t.status === 'Draft' || t.status === 'Dispatched');

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#E2E8F0]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold neon-text">Trip Dispatcher</h1>
      <p className="mt-1 text-[#64748B]">Create and dispatch trips</p>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {can(user?.role, Permissions.ACTIONS.assignTrip) && (
          <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-5">
            <h2 className="mb-4 font-semibold text-[#0F172A]">New Trip</h2>
            <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm text-[#64748B]">Vehicle</label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]"
                required
              >
                <option value="">Select</option>
                {availableVehicles.map((v) => (
                  <option key={v._id} value={v._id}>{v.name} ({v.licensePlate}) – cap {v.capacity} kg</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#64748B]">Driver</label>
              <select
                value={form.driverId}
                onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]"
                required
              >
                <option value="">Select</option>
                {availableDrivers.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#64748B]">Cargo (kg)</label>
                <input type="number" min={0} value={form.cargoWeight} onChange={(e) => setForm((f) => ({ ...f, cargoWeight: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]" required />
              </div>
              <div>
                <label className="block text-sm text-[#64748B]">Distance (km)</label>
                <input type="number" min={0} value={form.distance} onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]" required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#64748B]">Revenue ($)</label>
              <input type="number" min={0} value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A]" />
            </div>
            <div>
              <label className="block text-sm text-[#64748B]">Location link (Google Maps)</label>
              <input
                type="url"
                placeholder="https://maps.app.goo.gl/..."
                value={form.locationUrl}
                onChange={(e) => setForm((f) => ({ ...f, locationUrl: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] placeholder-[#64748B]"
              />
            </div>
            <button type="submit" disabled={creating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-2.5 font-medium text-[#0F172A] hover:bg-[#1D4ED8] disabled:opacity-50">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Create Trip
            </button>
            </form>
          </div>
        )}
        <div className="bg-white border border-[#E2E8F0] shadow-card rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-[#0F172A]">Active / Draft Trips</h2>
          <ul className="space-y-3">
            {draftOrDispatched.map((t) => (
              <li key={t._id} className="flex items-center justify-between rounded-lg bg-[#F1F5F9] px-4 py-3">
                <div>
                  <p className="font-medium text-[#0F172A]">
                    {(t.vehicleId as { name?: string })?.name} → {(t.driverId as { name?: string })?.name}
                  </p>
                  <p className="text-sm text-[#64748B]">{t.cargoWeight} kg · {t.distance} km · {t.status}</p>
                </div>
                <div className="flex gap-2">
                  {can(user?.role, Permissions.ACTIONS.assignTrip) && t.status === 'Draft' && (
                    <>
                      <button onClick={() => handleDispatch(t._id)} className="rounded bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-[#0F172A] hover:bg-[#1D4ED8]">
                        <Send className="inline h-4 w-4" /> Dispatch
                      </button>
                      <button onClick={() => handleCancel(t._id)} className="rounded bg-red-500/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/30">Cancel</button>
                    </>
                  )}
                  {can(user?.role, Permissions.ACTIONS.assignTrip) && t.status === 'Dispatched' && (
                    <button onClick={() => setCompleteModal({ trip: t })} className="rounded bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-[#0F172A] hover:bg-[#1D4ED8]">
                      Complete
                    </button>
                  )}
                </div>
              </li>
            ))}
            {draftOrDispatched.length === 0 && <p className="text-sm text-[#64748B]">No draft or active trips</p>}
          </ul>
        </div>
      </div>

      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] shadow-card w-full max-w-sm rounded-xl p-6">
            <h3 className="font-semibold text-[#0F172A]">Complete Trip</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-[#64748B]">Final odometer (km)</label>
                <input type="number" min={0} placeholder="Optional" value={completeForm.endOdometer} onChange={(e) => setCompleteForm((f) => ({ ...f, endOdometer: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[#0F172A] placeholder-[#64748B]" />
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
              <button onClick={handleComplete} className="flex-1 rounded-lg bg-[#2563EB] py-2 font-medium text-[#0F172A] hover:bg-[#1D4ED8]">Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
