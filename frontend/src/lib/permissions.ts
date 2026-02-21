/**
 * Production RBAC - Role-Based Access Control (Frontend)
 * Roles: Manager (full system), Fleet Manager, Dispatcher, Safety Officer, Financial Analyst
 * Mirrors backend strict validation; never rely on frontend alone.
 */

export const ROLES = {
  /** Backend-aligned: full system access, sidebar: Dashboard, Vehicles, Maintenance, Drivers, Compliance, Analytics, Expenses */
  Manager: 'Manager',
  FleetManager: 'Fleet Manager',
  Dispatcher: 'Dispatcher',
  /** Backend-aligned: API returns 'SafetyOfficer' */
  SafetyOfficer: 'SafetyOfficer',
  /** Backend-aligned: API returns 'FinancialAnalyst' */
  FinancialAnalyst: 'FinancialAnalyst',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Manager-only sidebar labels/paths (when user.role === 'Manager') */
export const MANAGER_NAV = [
  { href: '/dashboard', label: 'Dashboard', permission: 'dashboard' as const },
  { href: '/dashboard/vehicles', label: 'Vehicle Registry', permission: 'vehicles' as const },
  { href: '/dashboard/maintenance', label: 'Maintenance Logs', permission: 'maintenance' as const },
  { href: '/dashboard/drivers', label: 'Drivers', permission: 'drivers' as const },
  { href: '/dashboard/compliance', label: 'Driver Compliance', permission: 'compliance' as const },
  { href: '/dashboard/analytics', label: 'Analytics', permission: 'analytics' as const },
  { href: '/dashboard/expenses', label: 'Expenses', permission: 'expenses' as const },
] as const;

/** Dispatcher-only sidebar: Dashboard, Trip Dispatcher, Active Trips, Completed Trips, Fuel Logging */
export const DISPATCHER_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/trips', label: 'Trip Dispatcher' },
  { href: '/dashboard/trips/active', label: 'Active Trips' },
  { href: '/dashboard/trips/completed', label: 'Completed Trips' },
  { href: '/dashboard/fuel-logging', label: 'Fuel Logging' },
] as const;

/** Safety Officer-only sidebar: Dashboard, Driver Safety Profiles, Compliance Monitoring */
export const SAFETY_OFFICER_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/drivers', label: 'Driver Safety Profiles' },
  { href: '/dashboard/safety/compliance', label: 'Compliance Monitoring' },
] as const;

export const Permissions = {
  NAV: {
    dashboard: [ROLES.Manager, ROLES.FleetManager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    vehicles: [ROLES.Manager, ROLES.FleetManager],
    drivers: [ROLES.Manager, ROLES.SafetyOfficer, ROLES.FleetManager],
    trips: [ROLES.Dispatcher],
    maintenance: [ROLES.Manager, ROLES.FleetManager],
    completed: [ROLES.Dispatcher, ROLES.FleetManager],
    analytics: [ROLES.Manager, ROLES.FleetManager, ROLES.FinancialAnalyst],
    map: [ROLES.FleetManager, ROLES.Dispatcher],
    aiChat: [ROLES.FleetManager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    export: [ROLES.Manager, ROLES.FleetManager, ROLES.FinancialAnalyst],
    /** Manager-only: Driver Compliance page */
    compliance: [ROLES.Manager],
    /** Manager-only: Expenses (fuel + maintenance, edit) */
    expenses: [ROLES.Manager],
  },
  DASHBOARD: {
    full: [ROLES.Manager, ROLES.FleetManager],
    limited: [ROLES.Dispatcher],
    compliance: [ROLES.SafetyOfficer],
    financial: [ROLES.FinancialAnalyst],
  },
  VEHICLES: {
    add: [ROLES.Manager, ROLES.FleetManager],
    edit: [ROLES.Manager, ROLES.FleetManager],
    view: [ROLES.Manager, ROLES.FleetManager],
  },
  TRIPS: {
    create: [ROLES.Dispatcher],
    assign: [ROLES.Dispatcher],
    dispatch: [ROLES.Dispatcher],
    complete: [ROLES.Dispatcher, ROLES.FleetManager],
  },
  MAINTENANCE: {
    add: [ROLES.Manager, ROLES.FleetManager],
    edit: [ROLES.Manager, ROLES.FleetManager],
    view: [ROLES.Manager, ROLES.FleetManager],
  },
  DRIVERS: {
    view: [ROLES.Manager, ROLES.SafetyOfficer, ROLES.FleetManager],
    add: [ROLES.Manager, ROLES.FleetManager, ROLES.SafetyOfficer],
    edit: [ROLES.Manager, ROLES.SafetyOfficer, ROLES.FleetManager],
    updateStatus: [ROLES.Manager, ROLES.SafetyOfficer],
    delete: [ROLES.Manager],
  },
  FUEL_LOGS: {
    add: [ROLES.Manager, ROLES.Dispatcher],
    view: [ROLES.Manager, ROLES.FinancialAnalyst, ROLES.FleetManager],
    edit: [ROLES.Manager],
  },
  EXPENSES: {
    view: [ROLES.Manager],
    edit: [ROLES.Manager],
  },
  ANALYTICS: {
    view: [ROLES.Manager, ROLES.FleetManager, ROLES.FinancialAnalyst],
    export: [ROLES.Manager, ROLES.FleetManager, ROLES.FinancialAnalyst],
  },
  ACTIONS: {
    addVehicle: [ROLES.Manager, ROLES.FleetManager],
    editVehicle: [ROLES.Manager, ROLES.FleetManager],
    assignTrip: [ROLES.Dispatcher],
    addMaintenance: [ROLES.Manager, ROLES.FleetManager],
    viewAnalytics: [ROLES.Manager, ROLES.FleetManager, ROLES.FinancialAnalyst],
    exportReports: [ROLES.Manager, ROLES.FleetManager, ROLES.FinancialAnalyst],
    updateDriverStatus: [ROLES.Manager, ROLES.SafetyOfficer],
    addFuelLog: [ROLES.Manager, ROLES.Dispatcher],
    viewFuelLogs: [ROLES.Manager, ROLES.FinancialAnalyst, ROLES.FleetManager],
  },
};

export function can(role: string | undefined | null, allowed: readonly string[] | string[] | undefined): boolean {
  if (!allowed || allowed.length === 0) return true;
  if (!role) return false;
  return allowed.includes(role);
}

export function requireRole(role: string | undefined | null, allowed: readonly string[] | string[]): boolean {
  return can(role, allowed);
}

export default Permissions;
