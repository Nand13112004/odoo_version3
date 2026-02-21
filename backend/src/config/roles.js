/**
 * Production RBAC - Role-Based Access Control
 * Roles: Manager, Dispatcher, SafetyOfficer, FinancialAnalyst
 */

const ROLES = Object.freeze({
  Manager: 'Manager',
  Dispatcher: 'Dispatcher',
  SafetyOfficer: 'SafetyOfficer',
  FinancialAnalyst: 'FinancialAnalyst',
});

/** Who can access dashboard and with which scope */
const DASHBOARD_SCOPES = Object.freeze({
  full: [ROLES.Manager],
  limited: [ROLES.Dispatcher],
  compliance: [ROLES.SafetyOfficer],
  financial: [ROLES.FinancialAnalyst],
});

/** Route → allowed roles (strict backend validation) */
const ROUTE_PERMISSIONS = Object.freeze({
  // Dashboard
  'GET /dashboard/stats': [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
  'GET /dashboard/charts': [ROLES.Manager, ROLES.FinancialAnalyst],

  // Vehicles - Full CRUD Manager only; list for others
  'GET /vehicles': [ROLES.Manager, ROLES.Dispatcher, ROLES.FinancialAnalyst],
  'POST /vehicles': [ROLES.Manager],
  'PUT /vehicles': [ROLES.Manager],
  'DELETE /vehicles': [ROLES.Manager],
  'GET /vehicles/:id': [ROLES.Manager, ROLES.Dispatcher, ROLES.FinancialAnalyst],

  // Trips - Dispatcher creates and manages; all can view
  'GET /trips': [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
  'POST /trips': [ROLES.Dispatcher],
  'PUT /trips': [ROLES.Dispatcher],
  'POST /trips/:id/dispatch': [ROLES.Dispatcher],
  'POST /trips/:id/complete': [ROLES.Dispatcher],
  'POST /trips/:id/cancel': [ROLES.Dispatcher],

  // Drivers - Manager and SafetyOfficer can PATCH status; Manager full CRUD
  'GET /drivers': [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
  'POST /drivers': [ROLES.Manager],
  'PUT /drivers': [ROLES.Manager],
  'PATCH /drivers/:id/status': [ROLES.Manager, ROLES.SafetyOfficer],
  'DELETE /drivers': [ROLES.Manager],

  // Maintenance - Manager only write; FinancialAnalyst read (SafetyOfficer cannot access)
  'GET /maintenance': [ROLES.Manager, ROLES.FinancialAnalyst],
  'POST /maintenance': [ROLES.Manager],
  'PUT /maintenance': [ROLES.Manager],
  'DELETE /maintenance': [ROLES.Manager],

  // Fuel logs - Manager full CRUD; Dispatcher add + read; FinancialAnalyst read
  'GET /fuel-logs': [ROLES.Manager, ROLES.FinancialAnalyst, ROLES.Dispatcher],
  'POST /fuel-logs': [ROLES.Manager, ROLES.Dispatcher],
  'PUT /fuel-logs/:id': [ROLES.Manager],

  // Analytics / Export
  'GET /export/vehicles/csv': [ROLES.Manager, ROLES.FinancialAnalyst],
  'GET /export/trips/csv': [ROLES.Manager, ROLES.FinancialAnalyst],
  'GET /export/report/pdf': [ROLES.Manager, ROLES.FinancialAnalyst],

  // Gemini
  'GET /gemini/vehicle/:id/risk': [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
  'GET /gemini/financial-advice': [ROLES.Manager, ROLES.FinancialAnalyst],
  'POST /gemini/query': [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst],
});

module.exports = {
  ROLES,
  ROUTE_PERMISSIONS,
  DASHBOARD_SCOPES,
  ROLE_LIST: Object.values(ROLES),
};
