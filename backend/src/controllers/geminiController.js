const {
  analyzeVehicleRisk,
  generateFinancialAdvice,
  naturalLanguageQuery,
} = require('../services/geminiService');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');

exports.analyzeVehicleRisk = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, communityId: req.user.communityId });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const result = await analyzeVehicleRisk(vehicle);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.financialAdvice = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    const vehicles = await Vehicle.find({ communityId }).lean();
    const trips = await Trip.find({ communityId, status: 'Completed' }).lean();
    const result = await generateFinancialAdvice({ vehicles, trips });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.naturalLanguageQuery = async (req, res, next) => {
  try {
    const { query } = req.body;
    const communityId = req.user.communityId;
    
    // Require other models dynamically if not at top-level
    const Driver = require('../models/Driver');
    const Maintenance = require('../models/Maintenance');
    const FuelLog = require('../models/FuelLog');

    const vehicles = await Vehicle.find({ communityId }).lean();
    const trips = await Trip.find({ communityId }).lean();
    const drivers = await Driver.find({ communityId }).lean();
    const maintenanceRecords = await Maintenance.find({ communityId }).lean();
    const fuelLogs = await FuelLog.find({ communityId }).lean();

    const fleetData = { vehicles, trips, drivers, maintenanceRecords, fuelLogs };
    
    const result = await naturalLanguageQuery(query || '', fleetData);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
