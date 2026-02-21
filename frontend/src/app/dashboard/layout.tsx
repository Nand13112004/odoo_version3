'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { ROLES } from '@/lib/permissions';

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="pl-56 min-h-screen">{children}</main>
    </div>
  );
}
