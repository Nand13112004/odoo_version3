const Vehicle = require('../models/Vehicle');
const Maintenance = require('../models/Maintenance');

/**
 * Simulated predictive failure: y = a * e^(b*x)
 * Factors: odometer age, last maintenance date, fuel efficiency drop.
 * Risk score 0-100.
 */
const A = 5;
const B = 0.00001;

function exponentialRiskFactor(odometer) {
  if (!odometer || odometer <= 0) return 0;
  return Math.min(100, A * Math.exp(B * odometer));
}

async function getLastMaintenanceDate(vehicleId) {
  const last = await Maintenance.findOne({ vehicleId }).sort({ date: -1 }).select('date');
  return last?.date || null;
}

async function updateVehicleRiskScore(vehicleId) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return;

  const odometer = vehicle.odometer || 0;
  const lastMaintenance = await getLastMaintenanceDate(vehicleId);
  const daysSinceMaintenance = lastMaintenance
    ? (Date.now() - new Date(lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)
    : 365;
  const fuelEfficiency = vehicle.fuelEfficiency || 1;
  const efficiencyDrop = fuelEfficiency < 5 ? 20 : 0;

  let risk = exponentialRiskFactor(odometer);
  risk += Math.min(30, daysSinceMaintenance / 30);
  risk += efficiencyDrop;
  risk = Math.min(100, Math.max(0, Math.round(risk)));

  await Vehicle.findByIdAndUpdate(vehicleId, { riskScore: risk });
  return risk;
}

module.exports = { updateVehicleRiskScore, exponentialRiskFactor };
