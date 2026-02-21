'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { exportApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can, Permissions } from '@/lib/permissions';
import { FileDown } from 'lucide-react';

function downloadUrl(url: string, filename: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => alert('Download failed'));
}

export default function ExportPage() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!can(user?.role, Permissions.ACTIONS.exportReports)) router.replace('/dashboard/access-denied');
  }, [user?.role, router]);

  if (!can(user?.role, Permissions.ACTIONS.exportReports)) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold neon-text">Export</h1>
      <p className="mt-1 text-zinc-400">CSV and PDF reports</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <button
          onClick={() => downloadUrl(exportApi.vehiclesCsv(), 'vehicles.csv')}
          className="glass neon-border flex items-center gap-3 rounded-xl p-5 text-left transition hover:bg-[#00ffc8]/10"
        >
          <FileDown className="h-8 w-8 text-[#00ffc8]" />
          <div>
            <p className="font-medium text-white">Vehicles CSV</p>
            <p className="text-sm text-zinc-400">Export vehicle list</p>
          </div>
        </button>
        <button
          onClick={() => downloadUrl(exportApi.tripsCsv(), 'trips.csv')}
          className="glass neon-border flex items-center gap-3 rounded-xl p-5 text-left transition hover:bg-[#00ffc8]/10"
        >
          <FileDown className="h-8 w-8 text-[#00ffc8]" />
          <div>
            <p className="font-medium text-white">Trips CSV</p>
            <p className="text-sm text-zinc-400">Export trip history</p>
          </div>
        </button>
        <button
          onClick={() => downloadUrl(exportApi.reportPdf(), 'fleet-report.pdf')}
          className="glass neon-border flex items-center gap-3 rounded-xl p-5 text-left transition hover:bg-[#00ffc8]/10"
        >
          <FileDown className="h-8 w-8 text-[#00ffc8]" />
          <div>
            <p className="font-medium text-white">Report PDF</p>
            <p className="text-sm text-zinc-400">Fleet summary report</p>
          </div>
        </button>
      </div>
    </div>
  );
}
