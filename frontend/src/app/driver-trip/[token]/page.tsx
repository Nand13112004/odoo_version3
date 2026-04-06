'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { driverTrip as driverTripApi, type DriverTripDetails } from '@/lib/api';
import { MapPin, Package, Truck, FileText, CheckCircle2, XCircle, Loader2, AlertTriangle, Navigation, Clock } from 'lucide-react';

type PageState = 'loading' | 'ready' | 'accepted' | 'rejected' | 'error' | 'expired' | 'location_denied';

export default function DriverTripPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [trip, setTrip] = useState<DriverTripDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const trackingRef = useRef<NodeJS.Timeout | null>(null);
  const TRACKING_INTERVAL_MS = 15_000;

  // Fetch trip details on mount
  useEffect(() => {
    driverTripApi.get(token)
      .then((res) => {
        if (res.success && res.data) {
          setTrip(res.data);
          if (res.data.driverResponse === 'Accepted') setPageState('accepted');
          else if (res.data.driverResponse === 'Rejected') setPageState('rejected');
          else setPageState('ready');
        } else {
          setPageState('error');
          setErrorMsg(res.message || 'Invalid trip link.');
        }
      })
      .catch((err) => {
        const msg: string = err?.message || '';
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('completed')) {
          setPageState('expired');
        } else {
          setPageState('error');
          setErrorMsg(msg || 'Failed to load trip details.');
        }
      });
  }, [token]);

  // GPS tracking loop
  const sendLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        driverTripApi.updateLocation(token, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed ?? undefined,
          heading: pos.coords.heading ?? undefined,
        }).then(() => setLastPing(new Date()));
      },
      () => { /* silently ignore individual failures */ },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [token]);

  const startTracking = useCallback(() => {
    setTrackingActive(true);
    sendLocation(); // immediate first ping
    trackingRef.current = setInterval(sendLocation, TRACKING_INTERVAL_MS);
  }, [sendLocation]);

  useEffect(() => {
    return () => {
      if (trackingRef.current) clearInterval(trackingRef.current);
    };
  }, []);

  // Handle Accept
  const handleAccept = async () => {
    if (!navigator.geolocation) {
      setPageState('location_denied');
      return;
    }
    setActionLoading(true);
    navigator.geolocation.getCurrentPosition(
      async () => {
        try {
          await driverTripApi.accept(token);
          setPageState('accepted');
          startTracking();
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to accept trip.');
        } finally {
          setActionLoading(false);
        }
      },
      () => {
        setActionLoading(false);
        setPageState('location_denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle Reject
  const handleReject = async () => {
    setActionLoading(true);
    try {
      await driverTripApi.reject(token);
      setPageState('rejected');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reject trip.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

  if (pageState === 'loading') return <LoadingScreen />;
  if (pageState === 'expired') return <StatusScreen icon="expired" title="Link Expired" message="This trip link has expired or the trip is no longer active." />;
  if (pageState === 'error') return <StatusScreen icon="error" title="Invalid Link" message={errorMsg || 'This link is invalid or has been revoked.'} />;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">FleetFlow<span className="text-blue-400">AI</span></h1>
            <p className="text-xs text-slate-400">Driver Trip Portal</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">

        {/* Status banners */}
        {pageState === 'location_denied' && (
          <div className="flex items-start gap-3 rounded-xl border border-orange-500/40 bg-orange-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
            <div>
              <p className="font-semibold text-orange-300">Location Permission Required</p>
              <p className="mt-1 text-sm text-orange-200/80">
                Please allow location access in your browser settings, then try again. Location tracking is mandatory to accept this trip.
              </p>
            </div>
          </div>
        )}

        {pageState === 'accepted' && (
          <div className="flex items-start gap-3 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
            <div>
              <p className="font-semibold text-green-300">Trip Accepted ✅</p>
              <p className="mt-1 text-sm text-green-200/80">
                {trackingActive
                  ? `Live tracking is active. ${lastPing ? `Last ping: ${lastPing.toLocaleTimeString()}` : 'Starting...'}`
                  : 'Your dispatcher has been notified. Starting location tracking…'}
              </p>
            </div>
          </div>
        )}

        {pageState === 'rejected' && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-300">Trip Rejected</p>
              <p className="mt-1 text-sm text-red-200/80">You have declined this trip. Your dispatcher has been notified.</p>
            </div>
          </div>
        )}

        {errorMsg && pageState !== 'error' && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMsg}</p>
        )}

        {/* Trip Info Card */}
        {trip && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="border-b border-white/10 bg-white/5 px-5 py-4">
              <h2 className="font-semibold text-white text-lg">Trip Details</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </p>
            </div>

            <div className="divide-y divide-white/5 px-5">
              {/* Route */}
              <div className="py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pickup</p>
                    <p className="text-sm text-white mt-0.5">{trip.pickupLocation?.address || 'Not specified'}</p>
                  </div>
                </div>
                <div className="ml-3.5 h-4 w-px bg-white/10 mx-auto" style={{ marginLeft: '13px' }} />
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                    <MapPin className="h-3.5 w-3.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Drop-off</p>
                    <p className="text-sm text-white mt-0.5">{trip.dropLocation?.address || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Trip Stats */}
              <div className="grid grid-cols-2 gap-4 py-4">
                <StatItem icon={<Navigation className="h-4 w-4" />} label="Distance" value={`${trip.distance} km`} />
                <StatItem icon={<Package className="h-4 w-4" />} label="Cargo" value={`${trip.cargoWeight} kg`} />
              </div>

              {/* Vehicle */}
              <div className="py-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                  <Truck className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vehicle</p>
                  <p className="text-sm font-medium text-white">
                    {(trip.vehicleId as { name?: string })?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">{(trip.vehicleId as { licensePlate?: string })?.licensePlate}</p>
                </div>
              </div>

              {/* Dispatcher Notes */}
              {trip.dispatcherNotes && (
                <div className="py-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20">
                    <FileText className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dispatcher Notes</p>
                    <p className="text-sm text-slate-300 mt-0.5 whitespace-pre-wrap">{trip.dispatcherNotes}</p>
                  </div>
                </div>
              )}

              {/* Start time */}
              {trip.startTime && (
                <div className="py-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-500/20">
                    <Clock className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dispatched At</p>
                    <p className="text-sm text-white mt-0.5">
                      {new Date(trip.startTime).toLocaleString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {trip && pageState !== 'accepted' && pageState !== 'rejected' && pageState !== 'expired' && pageState !== 'error' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-4 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject Trip
            </button>
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Accept Trip
            </button>
          </div>
        )}

        {/* Tracking indicator */}
        {trackingActive && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 py-3 text-xs text-blue-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
            Live tracking active — sharing location every 15 seconds
          </div>
        )}

      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-400" />
        <p className="mt-4 text-slate-400">Loading trip details…</p>
      </div>
    </div>
  );
}

function StatusScreen({ icon, title, message }: { icon: 'expired' | 'error'; title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
        {icon === 'expired' ? (
          <Clock className="mx-auto h-14 w-14 text-slate-500" />
        ) : (
          <AlertTriangle className="mx-auto h-14 w-14 text-red-400" />
        )}
        <h2 className="mt-4 text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/50 text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
