const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const { updateVehicleRiskScore } = require('../services/riskService');
const { recalculateVehicleROI } = require('../services/roiService');

exports.getMaintenances = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    const { vehicleId } = req.query;
    const filter = { communityId, ...(vehicleId ? { vehicleId } : {}) };
    const maintenances = await Maintenance.find(filter).populate('vehicleId', 'name licensePlate').sort({ date: -1 });
    res.json({ success: true, data: maintenances });
  } catch (err) {
    next(err);
  }
};

exports.getMaintenance = async (req, res, next) => {
  try {
    const maintenance = await Maintenance.findOne({ _id: req.params.id, communityId: req.user.communityId }).populate('vehicleId');
    if (!maintenance) return res.status(404).json({ success: false, message: 'Maintenance not found' });
    res.json({ success: true, data: maintenance });
  } catch (err) {
    next(err);
  }
};

exports.createMaintenance = async (req, res, next) => {
  try {
    const maintenance = await Maintenance.create(req.body);
    const vehicle = await Vehicle.findById(req.body.vehicleId);
    if (vehicle) {
      await Vehicle.findByIdAndUpdate(req.body.vehicleId, {
        status: 'In Shop',
        totalMaintenanceCost: (vehicle.totalMaintenanceCost || 0) + (req.body.cost || 0),
      });
      await recalculateVehicleROI(req.body.vehicleId);
      await updateVehicleRiskScore(req.body.vehicleId);
    }
    const populated = await Maintenance.findById(maintenance._id).populate('vehicleId');
    const io = req.app.get('io');
    if (io) io.emit('maintenanceAdded', populated);
    if (io && vehicle) io.emit('vehicleStatusUpdated', { vehicleId: vehicle._id, status: 'In Shop' });
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

exports.updateMaintenance = async (req, res, next) => {
  try {
    const maintenance = await Maintenance.findOne({ _id: req.params.id, communityId: req.user.communityId });
    if (!maintenance) return res.status(404).json({ success: false, message: 'Maintenance not found' });
    const oldCost = maintenance.cost;
    Object.assign(maintenance, req.body);
    await maintenance.save();
    if (req.body.cost != null && req.body.cost !== oldCost) {
      const vehicle = await Vehicle.findById(maintenance.vehicleId);
      if (vehicle) {
        await Vehicle.findByIdAndUpdate(maintenance.vehicleId, {
          totalMaintenanceCost: (vehicle.totalMaintenanceCost || 0) - oldCost + (req.body.cost || 0),
        });
        await recalculateVehicleROI(maintenance.vehicleId);
      }
    }
    const populated = await Maintenance.findById(maintenance._id).populate('vehicleId');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

exports.deleteMaintenance = async (req, res, next) => {
  try {
    const maintenance = await Maintenance.findOne({ _id: req.params.id, communityId: req.user.communityId });
    if (!maintenance) return res.status(404).json({ success: false, message: 'Maintenance not found' });
    const vehicle = await Vehicle.findById(maintenance.vehicleId);
    if (vehicle) {
      await Vehicle.findByIdAndUpdate(maintenance.vehicleId, {
        totalMaintenanceCost: Math.max(0, (vehicle.totalMaintenanceCost || 0) - maintenance.cost),
      });
      await recalculateVehicleROI(maintenance.vehicleId);
    }
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
