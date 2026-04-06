'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { vehicles as vehiclesApi, type Vehicle } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Permissions, can } from '@/lib/permissions';

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', licensePlate: '', capacity: '', acquisitionCost: '', fuelEfficiency: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await vehiclesApi.list();
      setVehicles((res.data as Vehicle[]) || []);
    } catch (e) {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehiclesApi.create({
        name: form.name,
        licensePlate: form.licensePlate,
        capacity: Number(form.capacity),
        acquisitionCost: Number(form.acquisitionCost),
        fuelEfficiency: Number(form.fuelEfficiency),
      });
      setShowCreate(false);
      setForm({ name: '', licensePlate: '', capacity: '', acquisitionCost: '', fuelEfficiency: '' });
      await load();
    } catch (err) {
      alert('Create failed');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold neon-text">Vehicle Registry</h1>
          <p className="mt-1 text-sm text-[#64748B]">Manage your fleet</p>
        </div>
        {can(user?.role, Permissions.ACTIONS.addVehicle) && (
          <div>
            <button onClick={() => setShowCreate((s) => !s)} className="rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#E2E8F0]">
              {showCreate ? 'Cancel' : 'Add Vehicle'}
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <form onSubmit={create} className="bg-white border border-[#E2E8F0] shadow-card mb-6 space-y-4 rounded-xl p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[#0F172A] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
            <input required placeholder="License Plate" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[#0F172A] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
            <input required placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[#0F172A] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
            <input required placeholder="Acquisition Cost" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[#0F172A] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
            <input placeholder="Fuel Efficiency" value={form.fuelEfficiency} onChange={(e) => setForm({ ...form, fuelEfficiency: e.target.value })} className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[#0F172A] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-[#1D4ED8]">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-4 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-[#E2E8F0]">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-[#E2E8F0]" />
        ) : vehicles.length === 0 ? (
          <p className="text-sm text-[#64748B]">No vehicles</p>
        ) : (
          vehicles.map((v) => (
            <Link key={v._id} href={`/dashboard/vehicles/${v._id}`} className="bg-white border border-[#E2E8F0] shadow-card flex items-center justify-between rounded-xl p-4 transition hover:bg-[#F1F5F9]">
              <div>
                <p className="font-medium text-[#0F172A]">{v.name}</p>
                <p className="text-sm text-[#64748B]">{v.licensePlate}</p>
              </div>
              <div className="text-sm text-[#2563EB]">{v.status}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
