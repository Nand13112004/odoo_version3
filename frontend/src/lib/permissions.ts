/**
 * Role-Based Permission Matrix (Enterprise Level)
 * Add Vehicle: Manager only
 * Assign Trip: Dispatcher only
 * View Analytics: Manager + Finance only
 */
export const Permissions = {
  NAV: {
    dashboard: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
    vehicles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
    drivers: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
    trips: ['Dispatcher'],
    maintenance: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
    completed: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
    analytics: ['Fleet Manager', 'Financial Analyst'],
    map: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
    aiChat: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
  },
  ACTIONS: {
    addVehicle: ['Fleet Manager'],
    assignTrip: ['Dispatcher'],
    viewAnalytics: ['Fleet Manager', 'Financial Analyst'],
  },
};

export function can(role: string | undefined | null, allowed: string[] | undefined) {
  if (!allowed) return true; // if no restriction
  if (!role) return false;
  return allowed.includes(role);
}

export default Permissions;
