'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="glass neon-border w-full max-w-md rounded-2xl p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold neon-text">FleetFlow AI</h1>
        <p className="mb-6 text-sm text-zinc-400">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-[#00ffc8]/50 focus:outline-none focus:ring-1 focus:ring-[#00ffc8]/50"
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-[#00ffc8]/50 focus:outline-none focus:ring-1 focus:ring-[#00ffc8]/50"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#00ffc8]/20 py-2.5 font-medium text-[#00ffc8] transition hover:bg-[#00ffc8]/30 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Demo: manager@fleetflow.ai / password123
        </p>
        <p className="mt-2 text-center text-sm text-zinc-500">
          <Link href="/register" className="text-[#00ffc8]/80 hover:underline">Register</Link>
          {' · '}
          <Link href="/" className="text-[#00ffc8]/80 hover:underline">← Back</Link>
        </p>
      </div>
    </div>
  );
}
