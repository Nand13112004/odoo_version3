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
          <p className="mt-1 text-sm text-zinc-400">Manage your fleet</p>
        </div>
        {can(user?.role, Permissions.ACTIONS.addVehicle) && (
          <div>
            <button onClick={() => setShowCreate((s) => !s)} className="rounded-lg bg-[#00ffc8]/20 px-4 py-2 text-sm text-[#00ffc8]">
              {showCreate ? 'Cancel' : 'Add Vehicle'}
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <form onSubmit={create} className="mb-6 space-y-3 rounded-lg bg-zinc-900/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded p-2 bg-zinc-800/50" />
            <input required placeholder="License Plate" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} className="rounded p-2 bg-zinc-800/50" />
            <input required placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="rounded p-2 bg-zinc-800/50" />
            <input required placeholder="Acquisition Cost" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} className="rounded p-2 bg-zinc-800/50" />
            <input placeholder="Fuel Efficiency" value={form.fuelEfficiency} onChange={(e) => setForm({ ...form, fuelEfficiency: e.target.value })} className="rounded p-2 bg-zinc-800/50" />
          </div>
          <div>
            <button type="submit" className="rounded-lg bg-[#00ffc8]/20 px-4 py-2 text-sm text-[#00ffc8]">Create</button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {loading ? (
          <div className="h-40 animate-pulse rounded bg-zinc-800/50" />
        ) : vehicles.length === 0 ? (
          <p className="text-sm text-zinc-500">No vehicles</p>
        ) : (
          vehicles.map((v) => (
            <Link key={v._id} href={`/dashboard/vehicles/${v._id}`} className="rounded-lg bg-zinc-900/40 p-3 hover:bg-zinc-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{v.name}</p>
                  <p className="text-sm text-zinc-400">{v.licensePlate}</p>
                </div>
                <div className="text-sm text-zinc-400">{v.status}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
