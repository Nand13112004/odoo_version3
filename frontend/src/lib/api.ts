const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 403 && typeof window !== 'undefined') {
      window.location.href = '/dashboard/access-denied';
    }
    throw new Error(json.message || res.statusText);
  }
  return json;
}

export const auth = {
  login: (email: string, password: string) =>
    api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { name: string; email: string; password: string; role?: string; communityName?: string; inviteToken?: string }) =>
    api<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => api<{ user: User }>('/auth/me'),
};

export const community = {
  get: () => api<Community>('/community'),
  getDashboard: () => api<CommunityDashboard>('/community/dashboard'),
  getMembers: () => api<{ members: User[]; roleCounts: Record<string, number> }>('/community/members'),
  update: (name: string) => api<Community>('/community', { method: 'PUT', body: JSON.stringify({ name }) }),
  removeMember: (userId: string) => api(`/community/members/${userId}`, { method: 'DELETE' }),
};

export const invites = {
  create: (email: string, role: string) => api<{ invite: { inviteUrl: string; email: string; role: string; expiresAt: string } }>('/invites', { method: 'POST', body: JSON.stringify({ email, role }) }),
  list: () => api<Invite[]>('/invites'),
  validate: (token: string) =>
    api<{ valid: boolean; email?: string; role?: string; communityName?: string }>(`/invites/validate/${token}`),
};

export interface Community {
  _id: string;
  name: string;
  createdAt?: string;
  createdBy?: string;
}

export interface CommunityDashboard {
  community: Community;
  totalMembers: number;
  roleCounts: Record<string, number>;
  totalVehicles: number;
  totalDrivers: number;
}

export interface Invite {
  _id: string;
  email: string;
  role: string;
  communityId: string;
  inviteToken: string;
  expiresAt: string;
  invitedBy?: { name: string };
}

export const vehicles = {
  list: () => api<Vehicle[]>('/vehicles'),
  get: (id: string) => api<Vehicle>(`/vehicles/${id}`),
  create: (data: Partial<Vehicle>) => api<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Vehicle>) => api<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/vehicles/${id}`, { method: 'DELETE' }),
};

export const drivers = {
  list: () => api<Driver[]>('/drivers'),
  get: (id: string) => api<Driver>(`/drivers/${id}`),
  create: (data: Partial<Driver>) => api<Driver>('/drivers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Driver>) => api<Driver>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    api<Driver>(`/drivers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) => api(`/drivers/${id}`, { method: 'DELETE' }),
};

export const trips = {
  list: (status?: string) => api<Trip[]>(`/trips${status ? `?status=${status}` : ''}`),
  get: (id: string) => api<Trip>(`/trips/${id}`),
  create: (data: Partial<Trip>) => api<Trip>('/trips', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Trip>) => api<Trip>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  dispatch: (id: string) => api<{ data: Trip; shareLink?: string }>(`/trips/${id}/dispatch`, { method: 'POST' }),
  complete: (id: string, data: { fuelUsed?: number; cost?: number; endOdometer?: number }) =>
    api<Trip>(`/trips/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: string) => api<Trip>(`/trips/${id}/cancel`, { method: 'POST' }),
  getLocation: (id: string) => api<TripLocation>(`/trips/${id}/location`),
};

export const driverTrip = {
  get: (token: string) => api<DriverTripDetails>(`/driver-trip/${token}`),
  accept: (token: string) => api<{ driverResponse: string; trackingExpiry: string }>(`/driver-trip/${token}/accept`, { method: 'POST' }),
  reject: (token: string) => api<{ driverResponse: string }>(`/driver-trip/${token}/reject`, { method: 'POST' }),
  updateLocation: (token: string, payload: { lat: number; lng: number; accuracy?: number; speed?: number; heading?: number }) =>
    api(`/driver-trip/${token}/location`, { method: 'POST', body: JSON.stringify(payload) }),
};

export const maintenance = {
  list: (vehicleId?: string) => api<Maintenance[]>(`/maintenance${vehicleId ? `?vehicleId=${vehicleId}` : ''}`),
  get: (id: string) => api<Maintenance>(`/maintenance/${id}`),
  create: (data: Partial<Maintenance>) =>
    api<Maintenance>('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Maintenance>) =>
    api<Maintenance>(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/maintenance/${id}`, { method: 'DELETE' }),
};

export const fuelLogs = {
  list: (vehicleId?: string) =>
    api<FuelLog[]>(`/fuel-logs${vehicleId ? `?vehicleId=${vehicleId}` : ''}`),
  create: (data: { vehicleId: string; liters: number; cost: number }) =>
    api<FuelLog>('/fuel-logs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<FuelLog>) =>
    api<FuelLog>(`/fuel-logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const dashboard = {
  stats: () => api<DashboardStats>('/dashboard/stats'),
  charts: () => api<ChartData>('/dashboard/charts'),
};

export const gemini = {
  vehicleRisk: (vehicleId: string) => api<{ riskScore: number; suggestion: string; financialImpact: string }>(`/gemini/vehicle/${vehicleId}/risk`),
  financialAdvice: () => api<{ summary: string; recommendations: string[] }>('/gemini/financial-advice'),
  query: (query: string) => api<{ answer: string }>('/gemini/query', { method: 'POST', body: JSON.stringify({ query }) }),
};

export const exportApi = {
  vehiclesCsv: () => `${API_URL}/export/vehicles/csv`,
  tripsCsv: () => `${API_URL}/export/trips/csv`,
  reportPdf: () => `${API_URL}/export/report/pdf`,
};

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  communityId?: string;
  communityName?: string;
  isCommunityAdmin?: boolean;
}

export interface Vehicle {
  _id: string;
  name: string;
  licensePlate: string;
  capacity: number;
  odometer: number;
  acquisitionCost: number;
  fuelEfficiency: number;
  status: string;
  riskScore?: number;
  totalRevenue?: number;
  totalMaintenanceCost?: number;
  totalFuelCost?: number;
  roi?: number;
}

export interface Driver {
  _id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  safetyScore: number;
  status: string;
  category?: 'Truck' | 'Van' | 'Bike';
}

export interface FuelLog {
  _id: string;
  vehicleId: string | { _id: string; name?: string; licensePlate?: string };
  liters: number;
  cost: number;
  date: string;
}

export interface Trip {
  _id: string;
  vehicleId: string | Vehicle | { _id: string; name?: string; licensePlate?: string; status?: string };
  driverId: string | Driver | { _id: string; name?: string; status?: string };
  cargoWeight: number;
  distance: number;
  revenue: number;
  status: string;
  fuelUsed?: number;
  cost?: number;
  startTime?: string;
  endTime?: string;
  locationUrl?: string;
  shareToken?: string;
  shareTokenGeneratedAt?: string;
  driverResponse?: 'Pending' | 'Accepted' | 'Rejected';
  pickupLocation?: { address: string; lat?: number; lng?: number };
  dropLocation?: { address: string; lat?: number; lng?: number };
  dispatcherNotes?: string;
  trackingExpiry?: string;
  lastKnownLat?: number;
  lastKnownLng?: number;
  lastLocationAt?: string;
}

export interface TripLocation {
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  lastLocationAt: string | null;
  driverResponse: 'Pending' | 'Accepted' | 'Rejected';
  trackingExpiry: string | null;
  status: string;
  pickupLocation?: { address: string; lat?: number; lng?: number };
  dropLocation?: { address: string; lat?: number; lng?: number };
}

export interface DriverTripDetails {
  _id: string;
  status: string;
  driverResponse: 'Pending' | 'Accepted' | 'Rejected';
  pickupLocation: { address: string; lat?: number; lng?: number };
  dropLocation: { address: string; lat?: number; lng?: number };
  dispatcherNotes: string;
  distance: number;
  cargoWeight: number;
  startTime?: string;
  trackingExpiry?: string;
  vehicleId: { _id: string; name?: string; licensePlate?: string; category?: string };
  driverId: { _id: string; name?: string; licenseNumber?: string };
  createdAt: string;
}

export interface Maintenance {
  _id: string;
  vehicleId: string | { _id: string; name?: string };
  description: string;
  cost: number;
  severity: string;
  date: string;
}

export interface DashboardStats {
  scope?: 'full' | 'limited' | 'compliance' | 'financial';
  activeFleetCount?: number;
  vehiclesInMaintenance?: number;
  utilizationPercent?: number;
  pendingCargo?: number;
  highRiskVehicles?: number;
  monthlyProfit?: number;
  monthlyRevenue?: number;
  totalFleet?: number;
  totalOperationalCost?: number;
  availableVehiclesCount?: number;
  availableDriversCount?: number;
  suspendedDriversCount?: number;
  expiredLicensesCount?: number;
  lowSafetyScoreCount?: number;
  fuelExpenses?: number;
  maintenanceCosts?: number;
  vehicleROI?: { name: string; roi: number }[];
  suspendedDrivers?: { _id: string; name: string; status: string; licenseExpiry?: string }[];
  complianceAlerts?: string[];
  revenueVsExpense?: { revenue: number; expense: number };
}

export interface ChartData {
  revenueVsExpense: { name: string; revenue: number; expense: number }[];
  fuelTrend: { month: string; cost: number }[];
  fleetUtilization: { name: string; value: number }[];
  roiComparison: { name: string; roi: number }[];
}
