/**
 * Production RBAC - Role-Based Access Control (Frontend)
 * Roles: Manager, Dispatcher, SafetyOfficer, FinancialAnalyst
 * Mirrors backend strict validation; never rely on frontend alone.
 */

export const ROLES = {
  Manager: 'Manager',
  Dispatcher: 'Dispatcher',
  SafetyOfficer: 'SafetyOfficer',
  FinancialAnalyst: 'FinancialAnalyst',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const Permissions = {
  NAV: {
    dashboard: [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    vehicles: [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    drivers: [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    trips: [ROLES.Dispatcher],
    maintenance: [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    completed: [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    analytics: [ROLES.Manager, ROLES.FinancialAnalyst],
    map: [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    aiChat: [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
    export: [ROLES.Manager, ROLES.FinancialAnalyst],
  },
  ACTIONS: {
    addVehicle: [ROLES.Manager],
    editVehicle: [ROLES.Manager],
    assignTrip: [ROLES.Dispatcher],
    addMaintenance: [ROLES.Manager],
    viewAnalytics: [ROLES.Manager, ROLES.FinancialAnalyst],
    exportReports: [ROLES.Manager, ROLES.FinancialAnalyst],
    updateDriverStatus: [ROLES.SafetyOfficer],
    addFuelLog: [ROLES.Manager],
    viewFuelLogs: [ROLES.Manager, ROLES.FinancialAnalyst],
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
