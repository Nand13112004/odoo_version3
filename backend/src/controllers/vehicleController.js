const Vehicle = require('../models/Vehicle');
const { updateVehicleRiskScore } = require('../services/riskService');
const { recalculateVehicleROI } = require('../services/roiService');

exports.getVehicles = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    const vehicles = await Vehicle.find({ communityId }).sort({ createdAt: -1 });
    res.json({ success: true, data: vehicles });
  } catch (err) {
    next(err);
  }
};

exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, communityId: req.user.communityId });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, communityId: req.user.communityId });
    await updateVehicleRiskScore(vehicle._id);
    const updated = await Vehicle.findById(vehicle._id);
    const io = req.app.get('io');
    if (io && updated && (updated.riskScore || 0) >= 70) io.emit('riskAlert', { vehicleId: updated._id, riskScore: updated.riskScore });
    res.status(201).json({ success: true, data: updated || vehicle });
  } catch (err) {
    next(err);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, communityId: req.user.communityId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    await updateVehicleRiskScore(vehicle._id);
    const updated = await Vehicle.findById(vehicle._id);
    const io = req.app.get('io');
    if (io && updated && (updated.riskScore || 0) >= 70) io.emit('riskAlert', { vehicleId: updated._id, riskScore: updated.riskScore });
    res.json({ success: true, data: updated || vehicle });
  } catch (err) {
    next(err);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, communityId: req.user.communityId });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

exports.getVehicleROI = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, communityId: req.user.communityId });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    await recalculateVehicleROI(vehicle._id);
    const updated = await Vehicle.findById(req.params.id);
    res.json({ success: true, data: { roi: updated.roi, vehicle: updated } });
  } catch (err) {
    next(err);
  }
};
