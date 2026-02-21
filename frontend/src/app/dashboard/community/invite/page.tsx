'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { invites } from '@/lib/api';
import { ROLES } from '@/lib/permissions';

const INVITE_ROLES = ['Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'];

export default function InviteMembersPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviteUrl(null);
    setLoading(true);
    try {
      const r = await invites.create(email, role);
      const data = r.data as { invite?: { inviteUrl?: string } } | undefined;
      if (r.success && data?.invite?.inviteUrl) {
        setInviteUrl(data.invite.inviteUrl);
        setEmail('');
      } else {
        setError((r as { message?: string }).message || 'Failed to create invite');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      alert('Copied to clipboard');
    }
  };

  if (user?.role !== ROLES.Manager) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold neon-text">Invite Members</h1>
      <p className="mt-1 text-zinc-600">Invite users to your community with a specific role</p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-md">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900"
            >
              {INVITE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {inviteUrl && (
          <div className="mt-4 rounded-lg border border-teal-300 bg-teal-50 p-4">
            <p className="text-sm text-zinc-600">Invite link created. Share with the user:</p>
            <p className="mt-1 truncate text-sm text-teal-800">{inviteUrl}</p>
            <button type="button" onClick={copyUrl} className="mt-2 text-sm text-teal-800 hover:underline">
              Copy link
            </button>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 rounded-lg bg-[#00ffc8]/20 px-4 py-2 font-medium text-teal-800 hover:bg-[#00ffc8]/30 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </form>
    </div>
  );
}
