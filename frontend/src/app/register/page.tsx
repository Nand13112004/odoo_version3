'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth, invites } from '@/lib/api';
import type { User } from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams?.get('invite') || undefined;
  const { setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Manager');
  const [communityName, setCommunityName] = useState('');
  const [inviteInfo, setInviteInfo] = useState<{ email: string; role: string; communityName?: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inviteToken) {
      invites
        .validate(inviteToken)
        .then((r) => {
          if (r.success && (r.data as { valid?: boolean })?.valid) {
            const d = r.data as { email?: string; role?: string; communityName?: string };
            setInviteInfo({ email: d.email || '', role: d.role || 'Dispatcher', communityName: d.communityName });
            setEmail(d.email || '');
            setRole(d.role || 'Dispatcher');
          }
        })
        .catch(() => setError('Invalid or expired invite link'));
    }
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = inviteToken
        ? { name, email, password, inviteToken }
        : { name, email, password, role: 'Manager', communityName };
      const res = await auth.register(payload);
      const data = res.data as { token?: string; user?: User } | undefined;
      if (res.success && data?.token) {
        localStorage.setItem('token', data.token);
        if (data.user) setUser(data.user);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="glass neon-border w-full max-w-md rounded-2xl p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold neon-text">Register</h1>
        <p className="mb-6 text-sm text-zinc-600">Create an account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900" required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900" required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900" minLength={6} required />
          </div>
          {!inviteToken && (
            <div>
              <label className="mb-1 block text-sm text-zinc-600">Community / Company Name</label>
              <input
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900"
                placeholder="Your company or team name"
                required={!inviteToken}
              />
            </div>
          )}
          {inviteToken && inviteInfo && (
            <p className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-sm text-teal-800">
              Joining: {inviteInfo.communityName || 'Community'} as {inviteInfo.role}
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <Link href="/login" className="mt-4 block text-center text-sm text-teal-600 hover:underline">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
