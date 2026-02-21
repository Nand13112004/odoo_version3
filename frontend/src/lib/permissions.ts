/**
 * Production RBAC - Role-Based Access Control (Frontend)
 * Roles: Fleet Manager, Dispatcher, Safety Officer, Financial Analyst
 * Mirrors backend strict validation; never rely on frontend alone.
 */

export const ROLES = {
  FleetManager: 'Fleet Manager',
  Dispatcher: 'Dispatcher',
  SafetyOfficer: 'Safety Officer',
  FinancialAnalyst: 'Financial Analyst',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const Permissions = {
  NAV: {
    dashboard: [ROLES.FleetManager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    vehicles: [ROLES.FleetManager],
    drivers: [ROLES.SafetyOfficer, ROLES.FleetManager],
    trips: [ROLES.Dispatcher],
    maintenance: [ROLES.FleetManager],
    completed: [ROLES.Dispatcher, ROLES.FleetManager],
    analytics: [ROLES.FleetManager, ROLES.FinancialAnalyst],
    map: [ROLES.FleetManager, ROLES.Dispatcher],
    aiChat: [ROLES.FleetManager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    export: [ROLES.FleetManager, ROLES.FinancialAnalyst],
  },
  DASHBOARD: {
    full: [ROLES.FleetManager],
    limited: [ROLES.Dispatcher],
    compliance: [ROLES.SafetyOfficer],
    financial: [ROLES.FinancialAnalyst],
  },
  VEHICLES: {
    add: [ROLES.FleetManager],
    edit: [ROLES.FleetManager],
    view: [ROLES.FleetManager],
  },
  TRIPS: {
    create: [ROLES.Dispatcher],
    assign: [ROLES.Dispatcher],
    dispatch: [ROLES.Dispatcher],
    complete: [ROLES.Dispatcher, ROLES.FleetManager],
  },
  MAINTENANCE: {
    add: [ROLES.FleetManager],
    view: [ROLES.FleetManager],
  },
  DRIVERS: {
    view: [ROLES.SafetyOfficer, ROLES.FleetManager],
    add: [ROLES.FleetManager, ROLES.SafetyOfficer],       // Fleet Mgr + Safety Officer can add
    edit: [ROLES.SafetyOfficer],                          // Only Safety Officer can edit status
    updateStatus: [ROLES.SafetyOfficer],                  // Only Safety Officer can change status
  },
  FUEL_LOGS: {
    add: [ROLES.Dispatcher],
    view: [ROLES.FinancialAnalyst, ROLES.FleetManager],   // Fleet Mgr can only VIEW
    edit: [ROLES.FinancialAnalyst],                        // Only Financial Analyst can edit
  },
  ANALYTICS: {
    view: [ROLES.FleetManager, ROLES.FinancialAnalyst],
    export: [ROLES.FleetManager, ROLES.FinancialAnalyst],
  },
  ACTIONS: {
    addVehicle: [ROLES.FleetManager],
    editVehicle: [ROLES.FleetManager],
    assignTrip: [ROLES.Dispatcher],
    addMaintenance: [ROLES.FleetManager],
    viewAnalytics: [ROLES.FleetManager, ROLES.FinancialAnalyst],
    exportReports: [ROLES.FleetManager, ROLES.FinancialAnalyst],
    updateDriverStatus: [ROLES.SafetyOfficer],
    addFuelLog: [ROLES.Dispatcher],
    viewFuelLogs: [ROLES.FinancialAnalyst, ROLES.FleetManager],
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
