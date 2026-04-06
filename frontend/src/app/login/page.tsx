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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative flex min-h-screen items-center justify-center px-4 selection:bg-[#2563EB]/20 selection:text-[#2563EB]">
      <div className="fixed inset-0 z-0 mesh-gradient" />
      <div className="fixed inset-0 z-0 glow-overlay" />

      <main className="relative z-10 w-full max-w-[440px]">
        <div className="glass-card rounded-[2rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-[#E2E8F0]/80 overflow-hidden">
          {/* Brand */}
          <div className="flex flex-col items-center mb-10">
            <div className="mb-4 relative">
              <div className="absolute -inset-4 bg-[#2563EB]/10 blur-2xl rounded-full" />
              <svg className="relative z-10 w-12 h-12 text-[#2563EB]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-[#0F172A]">
              FleetFlow<span className="text-[#2563EB]">AI</span>
            </h1>
            <p className="text-[#64748B] font-semibold tracking-widest mt-1 text-xs uppercase">Pristine Observatory</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B] ml-1" htmlFor="email">
                Fleet Identifier
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 h-14 px-4 rounded-xl text-[#0F172A] placeholder:text-[#64748B]/50 transition-all outline-none"
                placeholder="manager@fleetflow.ai"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B] ml-1" htmlFor="password">
                Security Protocol
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 h-14 px-4 pr-12 rounded-xl text-[#0F172A] placeholder:text-[#64748B]/50 transition-all outline-none"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors text-sm"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-[#EF4444] bg-[#EF4444]/5 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#2563EB] text-white font-headline font-bold text-lg rounded-xl shadow-[0_8px_20px_-4px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_24px_-4px_rgba(37,99,235,0.35)] hover:bg-[#1D4ED8] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Log In</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-8 border-t border-[#E2E8F0] flex flex-col items-center space-y-4">
            <p className="text-sm text-[#64748B]">
              Demo: <span className="font-medium text-[#0F172A]">manager@fleetflow.ai</span> / <span className="font-medium text-[#0F172A]">password123</span>
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-[#64748B]">New to the platform?</span>
              <Link href="/register" className="text-[#2563EB] font-bold hover:underline decoration-2 underline-offset-4">
                Register
              </Link>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 flex justify-center items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold">Systems Nominal</span>
          </div>
          <div className="w-px h-3 bg-[#E2E8F0]" />
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold">v2.4.1 Pristine</span>
          </div>
        </div>
      </main>
    </div>
  );
}
