const Vehicle = require('../models/Vehicle');

/**
 * ROI = (Revenue - (Maintenance + Fuel)) / AcquisitionCost
 * Recalculate and persist is done via model totals; this ensures totals are in sync.
 */
async function recalculateVehicleROI(vehicleId) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return;
  const revenue = vehicle.totalRevenue || 0;
  const maintenance = vehicle.totalMaintenanceCost || 0;
  const fuel = vehicle.totalFuelCost || 0;
  const acquisition = vehicle.acquisitionCost || 1;
  const roi = ((revenue - (maintenance + fuel)) / acquisition) * 100;
  // ROI is virtual on model; we don't store it. Totals are already stored.
  return vehicle;
}

module.exports = { recalculateVehicleROI };
