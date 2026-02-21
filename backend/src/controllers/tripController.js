const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { ROLES } = require('../config/roles');
const { recalculateVehicleROI } = require('../services/roiService');
const { updateVehicleRiskScore } = require('../services/riskService');

exports.getTrips = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    const { status } = req.query;
    const filter = { communityId, ...(status ? { status } : {}) };
    const trips = await Trip.find(filter)
      .populate('vehicleId', 'name licensePlate status')
      .populate('driverId', 'name status licenseExpiry')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: trips });
  } catch (err) {
    next(err);
  }
};

exports.getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, communityId: req.user.communityId })
      .populate('vehicleId')
      .populate('driverId');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

const canCreateTrip = async (vehicleId, driverId, cargoWeight, userRole, communityId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, communityId });
  const driver = await Driver.findOne({ _id: driverId, communityId });
  if (!vehicle) return { ok: false, message: 'Vehicle not found' };
  if (!driver) return { ok: false, message: 'Driver not found' };
  if (cargoWeight > vehicle.capacity) return { ok: false, message: 'Cargo exceeds vehicle capacity' };
  if (vehicle.status !== 'Available') return { ok: false, message: 'Vehicle is not available' };
  if (new Date(driver.licenseExpiry) < new Date()) return { ok: false, message: 'Driver license expired' };
  if (userRole === ROLES.Dispatcher) {
    if (driver.status !== 'On Duty') return { ok: false, message: 'Only On Duty drivers can be assigned' };
  } else if (driver.status !== 'On Duty' && driver.status !== 'Off Duty') {
    return { ok: false, message: 'Driver is not available for duty' };
  }
  return { ok: true };
};

exports.createTrip = async (req, res, next) => {
  try {
    const { vehicleId, driverId, cargoWeight, distance, revenue, locationUrl } = req.body;
    const check = await canCreateTrip(vehicleId, driverId, cargoWeight, req.user?.role, req.user.communityId);
    if (!check.ok) return res.status(400).json({ success: false, message: check.message });

    const trip = await Trip.create({
      communityId: req.user.communityId,
      vehicleId,
      driverId,
      cargoWeight,
      distance,
      revenue: revenue || 0,
      status: 'Draft',
      locationUrl,
    });
    const populated = await Trip.findById(trip._id).populate('vehicleId').populate('driverId');
    const io = req.app.get('io');
    if (io) io.emit('tripCreated', populated);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

exports.dispatchTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, communityId: req.user.communityId }).populate('vehicleId').populate('driverId');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'Draft') return res.status(400).json({ success: false, message: 'Trip must be in Draft to dispatch' });

    const check = await canCreateTrip(trip.vehicleId._id, trip.driverId._id, trip.cargoWeight, req.user?.role, req.user.communityId);
    if (!check.ok) return res.status(400).json({ success: false, message: check.message });

    await Vehicle.findByIdAndUpdate(trip.vehicleId._id, { status: 'On Trip' });
    await Driver.findByIdAndUpdate(trip.driverId._id, { status: 'On Trip' });
    trip.status = 'Dispatched';
    trip.startTime = new Date();
    await trip.save();

    const io = req.app.get('io');
    if (io) io.emit('vehicleStatusUpdated', { vehicleId: trip.vehicleId._id, status: 'On Trip' });
    const updated = await Trip.findById(trip._id).populate('vehicleId').populate('driverId');
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

exports.completeTrip = async (req, res, next) => {
  try {
    const { fuelUsed, cost, endOdometer } = req.body;
    const trip = await Trip.findOne({ _id: req.params.id, communityId: req.user.communityId }).populate('vehicleId').populate('driverId');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'Dispatched') return res.status(400).json({ success: false, message: 'Trip must be Dispatched to complete' });

    const vehicle = trip.vehicleId;
    const newOdometer = (endOdometer != null && Number(endOdometer) >= 0)
      ? Number(endOdometer)
      : (vehicle.odometer || 0) + trip.distance;
    const newFuelUsed = (vehicle.totalFuelCost ? 0 : 0) + (fuelUsed || 0);
    let newFuelEfficiency = vehicle.fuelEfficiency;
    if (fuelUsed > 0) newFuelEfficiency = trip.distance / fuelUsed;

    await Vehicle.findByIdAndUpdate(vehicle._id, {
      status: 'Available',
      odometer: newOdometer,
      totalRevenue: (vehicle.totalRevenue || 0) + (trip.revenue || 0),
      totalFuelCost: (vehicle.totalFuelCost || 0) + (cost || 0),
      fuelEfficiency: newFuelEfficiency,
    });
    await Driver.findByIdAndUpdate(trip.driverId._id, { status: 'On Duty' });

    trip.status = 'Completed';
    trip.endTime = new Date();
    trip.fuelUsed = fuelUsed || 0;
    trip.cost = cost || 0;
    await trip.save();

    await recalculateVehicleROI(vehicle._id);
    await updateVehicleRiskScore(vehicle._id);

    const io = req.app.get('io');
    if (io) io.emit('vehicleStatusUpdated', { vehicleId: vehicle._id, status: 'Available' });
    const updated = await Trip.findById(trip._id).populate('vehicleId').populate('driverId');
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

exports.cancelTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, communityId: req.user.communityId }).populate('vehicleId').populate('driverId');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status === 'Dispatched') {
      await Vehicle.findByIdAndUpdate(trip.vehicleId._id, { status: 'Available' });
      await Driver.findByIdAndUpdate(trip.driverId._id, { status: 'On Duty' });
      const io = req.app.get('io');
      if (io) io.emit('vehicleStatusUpdated', { vehicleId: trip.vehicleId._id, status: 'Available' });
    }
    trip.status = 'Cancelled';
    await trip.save();
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

exports.updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, communityId: req.user.communityId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'Draft') return res.status(400).json({ success: false, message: 'Only draft trips can be updated' });
    const { cargoWeight, distance, revenue } = req.body;
    if (cargoWeight != null) trip.cargoWeight = cargoWeight;
    if (distance != null) trip.distance = distance;
    if (revenue != null) trip.revenue = revenue;
    await trip.save();
    const populated = await Trip.findById(trip._id).populate('vehicleId').populate('driverId');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
