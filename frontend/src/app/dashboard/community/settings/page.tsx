'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { community } from '@/lib/api';
import { ROLES } from '@/lib/permissions';

export default function CommunitySettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.role !== ROLES.Manager) return;
    community.get().then((r) => {
      if (r.success && r.data) setName((r.data as { name?: string }).name || '');
      setLoading(false);
    });
  }, [user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const r = await community.update(name);
      if (r.success) setSuccess(true);
      else setError((r as { message?: string }).message || 'Failed to update');
    } catch {
      setError('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== ROLES.Manager) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold neon-text">Community Settings</h1>
      <p className="mt-1 text-zinc-600">Update your community name</p>

      {loading ? (
        <div className="mt-8 h-10 w-10 animate-spin rounded-full border-2 border-[#00ffc8] border-t-transparent" />
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 max-w-md">
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Community / Company Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900"
              required
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          {success && <p className="mt-2 text-sm text-[#00ffc8]">Settings saved.</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}
    </div>
  );
}
