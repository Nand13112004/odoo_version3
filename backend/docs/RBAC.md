# FleetFlow AI – Production RBAC

Role-Based Access Control is enforced **strictly on the backend**. Frontend hiding is for UX only; never rely on it for security.

## Roles (enum)

| Role              | Description                          |
|-------------------|--------------------------------------|
| `Manager`         | Fleet Manager – full fleet & ops     |
| `Dispatcher`      | Trip creation & assignment           |
| `SafetyOfficer`   | Driver compliance & safety           |
| `FinancialAnalyst`| Cost, ROI, analytics, export         |

## Middleware

- **`protect`** – JWT auth. Sets `req.user`. Returns **401** if missing/invalid token.
- **`authorizeRoles(...roles)`** – Must be used after `protect`. Returns **403** if `req.user.role` not in `roles`.

Example:

```js
const { protect, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.get('/vehicles', protect, authorizeRoles(ROLES.Manager, ROLES.Dispatcher), getVehicles);
router.post('/vehicles', protect, authorizeRoles(ROLES.Manager), createVehicle);
```

## Route Permissions Matrix

| Resource     | GET (list/detail)     | POST | PUT/PATCH | DELETE |
|-------------|------------------------|------|-----------|--------|
| **Dashboard stats** | Manager, Dispatcher, SafetyOfficer, FinancialAnalyst | – | – | – |
| **Dashboard charts** | Manager, FinancialAnalyst | – | – | – |
| **Vehicles** | All roles | Manager | Manager | Manager |
| **Trips**    | All roles | Dispatcher | Dispatcher | – |
| **Trip dispatch/complete/cancel** | – | Dispatcher | – | – |
| **Drivers**  | All roles | Manager | Manager | Manager |
| **PATCH /drivers/:id/status** | – | – | SafetyOfficer | – |
| **Maintenance** | All roles | Manager | Manager | Manager |
| **Fuel logs** | Manager, FinancialAnalyst | Manager | – | – |
| **Export CSV/PDF** | Manager, FinancialAnalyst | – | – | – |
| **Gemini financial-advice** | Manager, FinancialAnalyst | – | – | – |

## Dashboard Stats by Role

- **Manager**: `scope: 'full'` – all KPIs, filters.
- **Dispatcher**: `scope: 'limited'` – active fleet, pending cargo, available vehicles/drivers.
- **SafetyOfficer**: `scope: 'compliance'` – suspended drivers, compliance alerts.
- **FinancialAnalyst**: `scope: 'financial'` – total operational cost, revenue vs expense, monthly profit.

## Error Responses

- **401 Unauthorized** – Missing or invalid JWT, or user not found. `code: 'UNAUTHORIZED'`.
- **403 Forbidden** – Valid user but role not allowed. `code: 'FORBIDDEN'`.
- **500 Internal Server Error** – Unexpected error. `code: 'INTERNAL_ERROR'`.

## Folder Structure

```
backend/src/
  config/
    roles.js      # ROLES, ROUTE_PERMISSIONS, DASHBOARD_SCOPES
  middleware/
    auth.js       # protect, authorizeRoles
    errorHandler.js
    validate.js
  models/
    User.js       # role enum from config/roles
  routes/
    auth.js
    vehicles.js
    trips.js
    drivers.js    # PATCH :id/status → SafetyOfficer
    maintenance.js
    fuelLogs.js
    dashboard.js
    export.js
    gemini.js
  controllers/
  services/
```

## Frontend Guards

- **Sidebar**: Menu items hidden via `can(user?.role, Permissions.NAV.*)`.
- **Pages**: Role-restricted pages (e.g. Analytics, Export) redirect to `/dashboard/access-denied` when `!can(user?.role, Permissions.ACTIONS.*)`.
- **Actions**: Buttons (e.g. Add Vehicle, Assign Trip, Driver status toggle) only rendered when `can(user?.role, Permissions.ACTIONS.*)`.

Backend always validates; frontend guards improve UX and avoid unnecessary 403s.
