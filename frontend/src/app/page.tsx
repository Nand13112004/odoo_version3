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
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0a0a0f] px-4">
      <h1 className="text-4xl font-bold neon-text">FleetFlow AI</h1>
      <p className="text-zinc-400">Autonomous Fleet Intelligence Platform</p>
      <Link
        href="/login"
        className="rounded-lg bg-[#00ffc8]/20 px-6 py-3 font-medium text-[#00ffc8] neon-border hover:bg-[#00ffc8]/30"
      >
        Login
      </Link>
    </div>
  );
}
