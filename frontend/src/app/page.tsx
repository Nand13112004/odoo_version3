'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) router.replace('/dashboard');
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-[#F8FAFC] px-4">
      <div className="fixed inset-0 z-0 mesh-gradient" />
      <div className="fixed inset-0 z-0 glow-overlay" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-headline text-5xl font-bold tracking-tight text-[#0F172A]">
            FleetFlow<span className="text-[#2563EB]">AI</span>
          </h1>
          <p className="text-[#64748B] font-medium tracking-wide text-sm uppercase">Autonomous Fleet Intelligence Platform</p>
        </div>
        <Link
          href="/login"
          className="rounded-lg bg-[#2563EB] px-8 py-3.5 font-headline font-bold text-white shadow-btn-primary hover:bg-[#1D4ED8] hover:shadow-lg transition-all"
        >
          Get Started →
        </Link>
      </div>
      <div className="fixed bottom-0 right-0 p-12 opacity-[0.03] hidden lg:block select-none pointer-events-none">
        <div className="font-headline text-[100px] font-bold leading-none text-[#0F172A] flex flex-col items-end">
          <span>OBSERVE</span>
          <span>OPTIMIZE</span>
          <span>ORCHESTRATE</span>
        </div>
      </div>
    </div>
  );
}
