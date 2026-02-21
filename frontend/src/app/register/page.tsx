'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/api';
import type { User } from '@/lib/api';
import Link from 'next/link';

const ROLES = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

export default function RegisterPage() {
  const { setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.register({ name, email, password, role });
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
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="glass neon-border w-full max-w-md rounded-2xl p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold neon-text">Register</h1>
        <p className="mb-6 text-sm text-zinc-400">Create an account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-4 py-2 text-white" required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-4 py-2 text-white" required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-4 py-2 text-white" minLength={6} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-4 py-2 text-white">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#00ffc8]/20 py-2.5 font-medium text-[#00ffc8] hover:bg-[#00ffc8]/30 disabled:opacity-50">
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <Link href="/login" className="mt-4 block text-center text-sm text-[#00ffc8]/80 hover:underline">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
