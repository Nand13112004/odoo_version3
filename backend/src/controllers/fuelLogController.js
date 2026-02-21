const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');
const { recalculateVehicleROI } = require('../services/roiService');

exports.getFuelLogs = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    const { vehicleId } = req.query;
    const filter = { communityId, ...(vehicleId ? { vehicleId } : {}) };
    const logs = await FuelLog.find(filter).populate('vehicleId', 'name licensePlate').sort({ date: -1 });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

exports.createFuelLog = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    const vehicle = await Vehicle.findOne({ _id: req.body.vehicleId, communityId });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const log = await FuelLog.create({ ...req.body, communityId });
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

exports.updateFuelLog = async (req, res, next) => {
  try {
    const log = await FuelLog.findOne({ _id: req.params.id, communityId: req.user.communityId });
    if (!log) return res.status(404).json({ success: false, message: 'Fuel log not found' });
    const oldCost = log.cost;
    const { liters, cost, date } = req.body;
    if (liters != null) log.liters = liters;
    if (cost != null) log.cost = cost;
    if (date != null) log.date = date;
    await log.save();
    if (cost != null && cost !== oldCost) {
      const vehicle = await Vehicle.findById(log.vehicleId);
      if (vehicle) {
        await Vehicle.findByIdAndUpdate(log.vehicleId, {
          totalFuelCost: Math.max(0, (vehicle.totalFuelCost || 0) - oldCost + cost),
        });
        await recalculateVehicleROI(log.vehicleId);
      }
    }
    const populated = await FuelLog.findById(log._id).populate('vehicleId');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
