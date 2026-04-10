'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { ROLES } from '@/lib/permissions';
import { Menu } from 'lucide-react';

/** Manager-only routes: only user.role === 'Manager' may access */
const MANAGER_ONLY_PATHS = ['/dashboard/compliance', '/dashboard/expenses', '/dashboard/community'];

/** Dispatcher cannot access these */
const DISPATCHER_RESTRICTED_PATHS = [
  '/dashboard/vehicles', '/dashboard/maintenance', '/dashboard/drivers', '/dashboard/compliance',
  '/dashboard/analytics', '/dashboard/expenses', '/dashboard/export', '/dashboard/map',
  '/dashboard/ai-chat', '/dashboard/fuel-logs',
];

/** Safety Officer: only Dashboard, Driver Safety Profiles, Compliance */
const SAFETY_OFFICER_RESTRICTED_PATHS = [
  '/dashboard/vehicles', '/dashboard/maintenance', '/dashboard/trips', '/dashboard/analytics',
  '/dashboard/expenses', '/dashboard/export', '/dashboard/map', '/dashboard/ai-chat',
  '/dashboard/fuel-logs', '/dashboard/fuel-logging', '/dashboard/compliance',
];

/** Financial Analyst: only Dashboard, Expense Logs, Fuel Reports, Analytics, Financial Reports, Export */
const FINANCIAL_ANALYST_RESTRICTED_PATHS = [
  '/dashboard/vehicles', '/dashboard/maintenance', '/dashboard/drivers', '/dashboard/trips',
  '/dashboard/expenses', '/dashboard/fuel-logs', '/dashboard/map', '/dashboard/ai-chat',
  '/dashboard/fuel-logging', '/dashboard/compliance', '/dashboard/safety',
];

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const isManagerOnly = MANAGER_ONLY_PATHS.some((p) => pathname?.startsWith(p));
    if (isManagerOnly && user.role !== ROLES.Manager) {
      router.replace('/dashboard/access-denied');
      return;
    }
    if (user.role === ROLES.Dispatcher) {
      const isRestricted = DISPATCHER_RESTRICTED_PATHS.some((p) => pathname?.startsWith(p));
      if (isRestricted) router.replace('/dashboard/access-denied');
      return;
    }
    if (user.role === ROLES.SafetyOfficer) {
      const isRestricted = SAFETY_OFFICER_RESTRICTED_PATHS.some((p) => pathname?.startsWith(p));
      if (isRestricted) router.replace('/dashboard/access-denied');
      return;
    }
    if (user.role === ROLES.FinancialAnalyst) {
      const isRestricted = FINANCIAL_ANALYST_RESTRICTED_PATHS.some((p) => pathname?.startsWith(p));
      if (isRestricted) router.replace('/dashboard/access-denied');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-[#E2E8F0] px-4 py-3 shadow-sm">
        <span className="font-headline font-bold text-[#0F172A] text-lg tracking-tight">
          FleetFlow<span className="text-[#2563EB]">AI</span>
        </span>
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="p-1 -mr-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Main Layout containing Sidebar and Content */}
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} close={() => setSidebarOpen(false)} />
        <main className="w-full min-h-screen md:pl-56">{children}</main>
      </div>
    </div>
  );
}
