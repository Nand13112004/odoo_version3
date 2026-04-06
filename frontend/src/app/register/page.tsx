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
            <p className="text-[#64748B] font-semibold tracking-widest mt-1 text-xs uppercase">Create Account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B] ml-1" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 h-14 px-4 rounded-xl text-[#0F172A] placeholder:text-[#64748B]/50 transition-all outline-none"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B] ml-1" htmlFor="reg-email">
                Fleet Identifier
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 h-14 px-4 rounded-xl text-[#0F172A] placeholder:text-[#64748B]/50 transition-all outline-none"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B] ml-1" htmlFor="reg-password">
                Security Protocol
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 h-14 px-4 rounded-xl text-[#0F172A] placeholder:text-[#64748B]/50 transition-all outline-none"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>

            {!inviteToken && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B] ml-1" htmlFor="community">
                  Community / Company
                </label>
                <input
                  id="community"
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 h-14 px-4 rounded-xl text-[#0F172A] placeholder:text-[#64748B]/50 transition-all outline-none"
                  placeholder="Your company or team name"
                  required={!inviteToken}
                />
              </div>
            )}

            {inviteToken && inviteInfo && (
              <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 px-4 py-3 text-sm text-[#0F172A]">
                <span className="font-medium">Joining:</span> {inviteInfo.communityName || 'Community'} as <span className="font-bold text-[#2563EB]">{inviteInfo.role}</span>
              </div>
            )}

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
                  <span>Create Account</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex justify-center">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-[#64748B]">Already have an account?</span>
              <Link href="/login" className="text-[#2563EB] font-bold hover:underline decoration-2 underline-offset-4">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
