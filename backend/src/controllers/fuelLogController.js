const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');
const { recalculateVehicleROI } = require('../services/roiService');

exports.getFuelLogs = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const filter = vehicleId ? { vehicleId } : {};
    const logs = await FuelLog.find(filter).populate('vehicleId', 'name licensePlate').sort({ date: -1 });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

exports.createFuelLog = async (req, res, next) => {
  try {
    const log = await FuelLog.create(req.body);
    const vehicle = await Vehicle.findById(req.body.vehicleId);
    if (vehicle) {
      await Vehicle.findByIdAndUpdate(req.body.vehicleId, {
        totalFuelCost: (vehicle.totalFuelCost || 0) + (req.body.cost || 0),
      });
      await recalculateVehicleROI(req.body.vehicleId);
    }
    const populated = await FuelLog.findById(log._id).populate('vehicleId');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
