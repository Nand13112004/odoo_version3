# 🚛 FleetFlow AI  
### Autonomous Fleet Intelligence & Logistics Management Platform

FleetFlow AI is a full-stack, AI-enhanced fleet and logistics management system designed to provide real-time operational control, predictive risk assessment, and financial performance analytics.

The platform combines modern full-stack engineering with intelligent decision support powered by Google Gemini API.

---

## 🎯 Project Objective

FleetFlow AI was built to simulate a real-world fleet operations control system capable of:

- Managing vehicles, drivers, and trips
- Enforcing operational business rules
- Predicting vehicle risk
- Monitoring ROI performance
- Delivering AI-powered insights
- Broadcasting real-time updates

The architecture follows a modular, event-driven design with secure role-based access control.

---

## 🏗️ System Architecture

The system consists of two primary layers:

### 1️⃣ Frontend (Next.js 14 – App Router)

Responsibilities:
- Dashboard & KPI visualization
- Fleet registry interface
- Driver management UI
- Trip lifecycle tracking
- Real-time updates via WebSockets
- AI interaction panel
- Financial charts & analytics

---

### 2️⃣ Backend (Node.js + Express)

Responsibilities:
- REST API management
- Business rule enforcement
- JWT authentication
- Role-Based Access Control (RBAC)
- Risk scoring engine
- ROI computation engine
- WebSocket event broadcasting
- Gemini API integration
- CSV & PDF export generation

---

### 3️⃣ Database Layer (MongoDB + Mongoose)

Handles:
- Vehicle records
- Driver records
- Trip history
- Maintenance logs
- Risk metrics
- Financial analytics

Connection pooling is managed through Mongoose.

---

## 🔄 System Data Flow

User → Next.js Frontend  
⬇  
Express Backend (API Gateway + Business Logic)  
⬇  
MongoDB (Data Persistence)  
⬇  
Gemini API (AI Insights)  
⬆  
Socket.io (Real-Time Updates)

---

## ✨ Core Features

### 🔐 Secure Authentication & RBAC

- JWT-based authentication
- Role-based access:
  - Fleet Manager
  - Dispatcher
  - Safety Officer
  - Financial Analyst
- Protected endpoints & middleware validation

---

### 🚛 Fleet Management

- Vehicle registration & capacity tracking
- Odometer tracking
- Operational status management
- Risk scoring (0–100 scale)
- ROI calculation per vehicle

ROI Formula: (Revenue - (Maintenance + Fuel)) / AcquisitionCost


---

### 👨‍✈️ Driver Management

- License expiry validation
- Safety score tracking
- On Duty / Off Duty / On Trip status control
- Trip eligibility enforcement

---

### 🧾 Trip Lifecycle Engine

Business logic enforced:

- Cargo must not exceed vehicle capacity
- Vehicle must be available
- Driver must have valid license
- Driver must be On Duty

State transitions:
- Dispatch → Vehicle & Driver → On Trip
- Complete → Odometer update + ROI recalculation
- Cancel → Status restored

---

### 🔧 Maintenance Management

- Maintenance severity tracking
- Automatic vehicle status update → In Shop
- Risk score recalibration

---

### 📊 Predictive Risk Engine

A simulated predictive model calculates risk based on:

- Odometer reading
- Maintenance frequency
- Fuel efficiency
- Vehicle operational patterns

Outputs riskScore (0–100) used for alerts.

---

### 🤖 Gemini AI Integration

FleetFlow AI integrates Gemini API to provide:

- Vehicle risk explanation
- Financial optimization advice
- Natural language fleet queries
- Strategic operational insights

---

### ⚡ Real-Time Event System

Socket.io broadcasts:

- `vehicleStatusUpdated`
- `tripCreated`
- `maintenanceAdded`
- `riskAlert`

Ensures dashboard remains synchronized without manual refresh.

---

### 📤 Data Export

- CSV export (Vehicles, Trips)
- Fleet performance PDF report

---

## 🛠️ Technology Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Framer Motion
- Socket.io Client
- Mapbox (optional)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- RBAC Middleware
- Socket.io
- Gemini API

---

## 🚀 Installation & Setup

### 🔧 Prerequisites

- Node.js 18+
- MongoDB (Local or Atlas)
- Gemini API key (optional)
- Mapbox token (optional)

---

### 🖥 Backend Setup

```bash
cd backend
cp .env.example .env
# Configure:
# MONGODB_URI
# JWT_SECRET
# GEMINI_API_KEY (optional)
npm install
npm run seed
npm run dev

Backend runs at:
http://localhost:5000

### Frontend Setup

cd frontend
cp .env.local.example .env.local
# Configure:
# NEXT_PUBLIC_API_URL
# NEXT_PUBLIC_WS_URL
npm install
npm run dev

Frontend runs at:
http://localhost:3000

Backend (.env)
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fleetflow
JWT_SECRET=your_secure_secret
GEMINI_API_KEY=optional_key
CORS_ORIGIN=http://localhost:3000

Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_MAPBOX_TOKEN=optional
