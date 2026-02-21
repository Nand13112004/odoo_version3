'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00ffc8] border-t-transparent" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="pl-56 min-h-screen">{children}</main>
    </div>
  );
}
