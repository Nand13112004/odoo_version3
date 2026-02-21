'use client';

import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <ShieldX className="h-16 w-16 text-red-400/80" />
      <h1 className="mt-4 text-2xl font-bold text-white">Access Denied</h1>
      <p className="mt-2 max-w-md text-center text-zinc-400">
        You don&apos;t have permission to view this page. Contact your administrator if you believe this is an error.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-[#00ffc8]/20 px-4 py-2 text-sm font-medium text-[#00ffc8] hover:bg-[#00ffc8]/30"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
