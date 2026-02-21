require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Vehicle = require('../src/models/Vehicle');
const Driver = require('../src/models/Driver');
const Trip = require('../src/models/Trip');
const Maintenance = require('../src/models/Maintenance');
const FuelLog = require('../src/models/FuelLog');
const { updateVehicleRiskScore } = require('../src/services/riskService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetflow-ai';

const users = [
  { name: 'Admin Fleet', email: 'manager@fleetflow.ai', password: 'password123', role: 'Manager' },
  { name: 'Dispatch User', email: 'dispatcher@fleetflow.ai', password: 'password123', role: 'Dispatcher' },
  { name: 'Safety User', email: 'safety@fleetflow.ai', password: 'password123', role: 'SafetyOfficer' },
  { name: 'Finance User', email: 'finance@fleetflow.ai', password: 'password123', role: 'FinancialAnalyst' },
];

const vehicles = [
  { name: 'Truck Alpha', licensePlate: 'FL-001', capacity: 5000, odometer: 45000, acquisitionCost: 85000, fuelEfficiency: 8, status: 'Available' },
  { name: 'Truck Beta', licensePlate: 'FL-002', capacity: 7500, odometer: 120000, acquisitionCost: 92000, fuelEfficiency: 6.5, status: 'Available' },
  { name: 'Van Gamma', licensePlate: 'FL-003', capacity: 1500, odometer: 22000, acquisitionCost: 35000, fuelEfficiency: 12, status: 'On Trip' },
  { name: 'Truck Delta', licensePlate: 'FL-004', capacity: 5000, odometer: 89000, acquisitionCost: 78000, fuelEfficiency: 7, status: 'In Shop' },
  { name: 'Van Epsilon', licensePlate: 'FL-005', capacity: 2000, odometer: 15000, acquisitionCost: 42000, fuelEfficiency: 11, status: 'Available' },
];

const drivers = [
  { name: 'John Driver', licenseNumber: 'DL-1001', licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), safetyScore: 95, status: 'On Duty' },
  { name: 'Jane Smith', licenseNumber: 'DL-1002', licenseExpiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000), safetyScore: 88, status: 'On Trip' },
  { name: 'Bob Wilson', licenseNumber: 'DL-1003', licenseExpiry: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000), safetyScore: 92, status: 'Off Duty' },
  { name: 'Alice Brown', licenseNumber: 'DL-1004', licenseExpiry: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), safetyScore: 90, status: 'On Duty' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Driver.deleteMany({});
  await Trip.deleteMany({});
  await Maintenance.deleteMany({});
  await FuelLog.deleteMany({});

  const createdUsers = await User.insertMany(users);
  const createdVehicles = await Vehicle.insertMany(vehicles);
  const createdDrivers = await Driver.insertMany(drivers);

  await Trip.insertMany([
    { vehicleId: createdVehicles[0]._id, driverId: createdDrivers[0]._id, cargoWeight: 3000, distance: 450, revenue: 1200, status: 'Completed', fuelUsed: 56, cost: 280, startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000) },
    { vehicleId: createdVehicles[2]._id, driverId: createdDrivers[1]._id, cargoWeight: 1200, distance: 180, revenue: 580, status: 'Dispatched', startTime: new Date() },
    { vehicleId: createdVehicles[1]._id, driverId: createdDrivers[3]._id, cargoWeight: 5000, distance: 320, revenue: 0, status: 'Draft' },
  ]);

  await Maintenance.insertMany([
    { vehicleId: createdVehicles[3]._id, description: 'Brake pads replacement', cost: 450, severity: 'High', date: new Date() },
    { vehicleId: createdVehicles[1]._id, description: 'Oil change', cost: 120, severity: 'Low', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  ]);

  await FuelLog.insertMany([
    { vehicleId: createdVehicles[0]._id, liters: 80, cost: 400, date: new Date() },
    { vehicleId: createdVehicles[2]._id, liters: 35, cost: 175, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  ]);

  for (const v of createdVehicles) {
    await Vehicle.findByIdAndUpdate(v._id, {
      totalRevenue: v._id.equals(createdVehicles[0]._id) ? 1200 : 0,
      totalMaintenanceCost: v._id.equals(createdVehicles[3]._id) ? 450 : v._id.equals(createdVehicles[1]._id) ? 120 : 0,
      totalFuelCost: v._id.equals(createdVehicles[0]._id) ? 400 : v._id.equals(createdVehicles[2]._id) ? 175 : 0,
    });
    await updateVehicleRiskScore(v._id);
  }

  console.log('Seed complete. Users:', createdUsers.length, 'Vehicles:', createdVehicles.length, 'Drivers:', createdDrivers.length);
  console.log('Login: manager@fleetflow.ai / password123');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
