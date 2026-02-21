const {
  analyzeVehicleRisk,
  generateFinancialAdvice,
  naturalLanguageQuery,
} = require('../services/geminiService');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');

exports.analyzeVehicleRisk = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const result = await analyzeVehicleRisk(vehicle);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.financialAdvice = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find().lean();
    const trips = await Trip.find({ status: 'Completed' }).lean();
    const result = await generateFinancialAdvice({ vehicles, trips });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.naturalLanguageQuery = async (req, res, next) => {
  try {
    const { query } = req.body;
    const vehicles = await Vehicle.find().lean();
    const trips = await Trip.find().lean();
    const result = await naturalLanguageQuery(query || '', { vehicles, trips });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
