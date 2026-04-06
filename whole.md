# FleetFlow AI – Detailed Project Analysis

## 1. Folder Structure

The project is divided into two main parts: a **Frontend** (Next.js) and a **Backend** (Node.js/Express).

### Root Directory
- `frontend/`: Next.js web application.
- `backend/`: Node.js/Express API server.
- `Dockerfile.frontend`: Docker configuration for the frontend.
- `Dockerfile.backend`: Docker configuration for the backend.
- `docker-compose.yml`: Orchastraion for running both services and MongoDB.
- `README.md`: High-level project overview.

### Backend Structure (`backend/`)
- `src/`:
  - `config/`: Configuration files (e.g., roles).
  - `controllers/`: Request handlers and business logic.
  - `middleware/`: Express middleware (Auth, error handling).
  - `models/`: Mongoose schemas (Vehicle, Driver, Trip, User, etc.).
  - `routes/`: API endpoint definitions.
  - `services/`: Specialized logic (Gemini AI, ROI calculation, Risk scoring).
  - `server.js`: entry point for the API server.
- `scripts/`: Utility scripts (e.g., `seed.js` for demo data).
- `docs/`: Documentation files.
- `.env`: Environment variables.

### Frontend Structure (`frontend/`)
- `src/`:
  - `app/`: Next.js App Router (Pages and Layouts).
    - `dashboard/`: Protected dashboard routes.
    - `login/` & `register/`: Auth pages.
  - `components/`: Reusable UI components (Sidebar, Charts, Modals).
  - `context/`: React Context providers (AuthContext).
  - `lib/`: Utilities, API client, and permission constants.
- `public/`: Static assets.
- `tailwind.config.ts`: Styling configuration.
- `tsconfig.json`: TypeScript configuration.

---

## 2. Designing & Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router).
- **Styling**: Tailwind CSS with a modern "Dark Theme" / "Glassmorphism" aesthetic.
- **Animations**: Framer Motion for smooth transitions.
- **Charts**: Recharts for data visualization.
- **Real-time**: Socket.io-client for live updates.
- **Maps**: Mapbox (optional) for vehicle tracking.

### Backend
- **Runtime**: Node.js.
- **Framework**: Express.js.
- **Database**: MongoDB with Mongoose ODM.
- **Authentication**: JWT (JSON Web Tokens).
- **AI Integration**: Google Gemini API for risk analysis and financial advice.
- **Real-time**: Socket.io for server-side events.

---

## 3. APIs (Endpoints)

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| **Auth** | | | |
| POST | `/api/auth/register` | User registration | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/me` | Get current user info | User |
| **Fleet** | | | |
| GET | `/api/vehicles` | List all vehicles | User |
| POST | `/api/vehicles` | Add new vehicle | Manager |
| GET | `/api/vehicles/:id` | Get vehicle details | User |
| **Drivers** | | | |
| GET | `/api/drivers` | List all drivers | User |
| POST | `/api/drivers` | Add new driver | Manager |
| **Trips** | | | |
| POST | `/api/trips` | Create a trip (Draft) | Manager/Dispatcher |
| POST | `/api/trips/:id/dispatch`| Dispatch a trip | Manager/Dispatcher |
| POST | `/api/trips/:id/complete`| Complete a trip | Manager/Dispatcher |
| **AI (Gemini)** | | | |
| GET | `/api/gemini/vehicle/:id/risk`| AI risk analysis | User |
| GET | `/api/gemini/financial-advice`| AI financial advice | User |
| **Dashboard** | | | |
| GET | `/api/dashboard/stats` | KPI summary | User |
| GET | `/api/dashboard/charts` | Chart data | User |

---

## 4. Pages Redirection & Auth Flow

### Authentication Flow
1. **Login**: User submits credentials to `/api/auth/login`.
2. **Token Store**: JWT is stored in `localStorage` on the frontend.
3. **Context**: `AuthContext` verifies the token on mount via `/api/auth/me`.

### Redirection Logic (`frontend/src/app/dashboard/layout.tsx`)
The application uses a centered layout-level check for route protection:
- **Unauthenticated**: Users trying to access `/dashboard/*` without a token are redirected to `/login`.
- **RBAC (Role-Based Access Control)**:
  - **Managers**: Have full access.
  - **Dispatchers**: Restricted from Compliance, Expenses, Analytics, etc.
  - **Safety Officers**: Only allowed in Safety profiles and Compliance.
  - **Financial Analysts**: Only allowed in Finance, Expenses, and Analytics.
- **Access Denied**: Unauthorized roles are redirected to `/dashboard/access-denied`.

---

## 5. Pipelines & Deployment

### Development Pipeline
- **Seeding**: `npm run seed` in the backend populates the database with demo data.
- **Testing**: `npm test` in the backend runs unit tests for core services (like risk scoring).

### Deployment (Docker)
The project use Docker for consistent environments:
- `docker-compose.yml` spins up:
  - `fleetflow-backend`: Port 5000.
  - `fleetflow-frontend`: Port 3000.
  - `mongodb`: Database service.

---

## 6. Workflow (Core Business Logic)

The primary workflow revolves around the **Trip Lifecycle**:

1. **Trip Creation (Draft)**:
   - User selects a vehicle and driver.
   - System checks: Vehicle status must be `Available`, Driver must be `On Duty`.
   - Trip record is created with status `Draft`.

2. **Dispatching**:
   - Updates Vehicle status to `On Trip`.
   - Updates Driver status to `On Trip`.
   - Trip status moves to `Dispatched`.
   - Socket.io emits `vehicleStatusUpdated`.

3. **Completion**:
   - User inputs fuel used and final odometer.
   - Vehicle status returns to `Available`.
   - Driver status returns to `On Duty`.
   - **ROI Service**: Recalculates vehicle ROI based on revenue and costs.
   - **Risk Service**: Recalculates vehicle risk score based on new mileage and efficiency.

4. **Maintenance**:
   - Adding a maintenance record automatically sets the vehicle status to `In Shop`, blocking it from new trips.
