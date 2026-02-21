# FleetFlow AI – Autonomous Fleet Intelligence Platform

Full-stack AI-powered Fleet & Logistics Management System with real-time updates, predictive risk, and Gemini API integration.

## Features

- **Auth**: JWT, RBAC (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst)
- **Fleet**: Vehicle registry, capacity, odometer, status, risk score, ROI
- **Drivers**: License expiry, safety score, On Duty / Off Duty / On Trip
- **Trips**: Create, dispatch, complete with business rules (capacity, availability, license)
- **Maintenance**: Records with severity; vehicle status → In Shop
- **ROI**: `(Revenue - (Maintenance + Fuel)) / AcquisitionCost` per vehicle
- **Predictive risk**: Simulated model (odometer, last maintenance, fuel efficiency) → riskScore 0–100
- **Gemini API**: Vehicle risk analysis, financial advice, natural language queries
- **Real-time**: Socket.io events: `vehicleStatusUpdated`, `tripCreated`, `maintenanceAdded`, `riskAlert`
- **Export**: CSV (vehicles, trips), PDF report
- **UI**: Dark theme, neon accent, glassmorphism, Recharts, Framer Motion, Mapbox (optional)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind, Recharts, Framer Motion, Socket.io client, Mapbox
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, RBAC, Socket.io, Gemini API

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- (Optional) [Gemini API key](https://makersuite.google.com/app/apikey)
- (Optional) [Mapbox token](https://www.mapbox.com/) for Live Map

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run seed   # demo users + vehicles + drivers + trips
npm run dev    # http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api
# Set NEXT_PUBLIC_WS_URL=http://localhost:5000
# Optionally NEXT_PUBLIC_MAPBOX_TOKEN=...
npm install
npm run dev    # http://localhost:3000
```

### Demo Login

- **Email**: `manager@fleetflow.ai`
- **Password**: `password123`

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register (name, email, password, role) |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user (Bearer) |
| GET | /api/vehicles | List vehicles |
| GET | /api/vehicles/:id | Get vehicle |
| POST | /api/vehicles | Create (Fleet Manager) |
| PUT | /api/vehicles/:id | Update (Fleet Manager) |
| GET | /api/drivers | List drivers |
| POST | /api/drivers | Create driver |
| GET | /api/trips | List trips (optional ?status=) |
| POST | /api/trips | Create trip |
| POST | /api/trips/:id/dispatch | Dispatch trip |
| POST | /api/trips/:id/complete | Complete (body: fuelUsed, cost) |
| POST | /api/trips/:id/cancel | Cancel trip |
| GET | /api/maintenance | List maintenance |
| POST | /api/maintenance | Add maintenance |
| GET | /api/dashboard/stats | KPIs |
| GET | /api/dashboard/charts | Charts data |
| GET | /api/gemini/vehicle/:id/risk | AI vehicle risk |
| GET | /api/gemini/financial-advice | AI financial advice |
| POST | /api/gemini/query | Natural language (body: query) |
| GET | /api/export/vehicles/csv | Download vehicles CSV |
| GET | /api/export/trips/csv | Download trips CSV |
| GET | /api/export/report/pdf | Download fleet report PDF |

All protected routes require header: `Authorization: Bearer <token>`.

## Business Rules

- **Trip creation** blocked if: cargo > vehicle capacity, vehicle not Available, driver license expired, driver not On Duty.
- **Dispatch**: vehicle → On Trip, driver → On Trip.
- **Complete**: vehicle → Available, driver → On Duty; odometer and fuel totals updated; ROI recalculated.
- **Maintenance added**: vehicle → In Shop.

## Docker

```bash
# From repo root
export JWT_SECRET=your-secret
export GEMINI_API_KEY=your-key   # optional
docker-compose up --build
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- MongoDB: local container

## Deployment

- **Backend**: Render, Railway, or any Node host. Set `MONGODB_URI` (e.g. Atlas), `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGIN` (frontend URL).
- **Frontend**: Vercel. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to your backend URL.
- **MongoDB**: Use MongoDB Atlas and set `MONGODB_URI` in backend env.

## Tests

```bash
cd backend
npm test
```

Runs unit tests for risk service (and can be extended).

## License

MIT.
