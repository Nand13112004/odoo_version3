import { io } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

let socket: ReturnType<typeof io> | null = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (!socket) socket = io(WS_URL, { autoConnect: true });
  return socket;
}

export function useSocketEvents(callbacks: {
  vehicleStatusUpdated?: (data: { vehicleId: string; status: string }) => void;
  tripCreated?: (data: unknown) => void;
  maintenanceAdded?: (data: unknown) => void;
  riskAlert?: (data: unknown) => void;
}) {
  if (typeof window === 'undefined') return () => {};
  const s = getSocket();
  if (!s) return () => {};
  if (callbacks.vehicleStatusUpdated) s.on('vehicleStatusUpdated', callbacks.vehicleStatusUpdated);
  if (callbacks.tripCreated) s.on('tripCreated', callbacks.tripCreated);
  if (callbacks.maintenanceAdded) s.on('maintenanceAdded', callbacks.maintenanceAdded);
  if (callbacks.riskAlert) s.on('riskAlert', callbacks.riskAlert);
  return () => {
    s.off('vehicleStatusUpdated');
    s.off('tripCreated');
    s.off('maintenanceAdded');
    s.off('riskAlert');
  };
}
