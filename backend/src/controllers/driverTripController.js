const Trip = require('../models/Trip');
const LocationUpdate = require('../models/LocationUpdate');

/**
 * GET /api/driver-trip/:token
 * Public endpoint — returns trip details for the driver.
 */
exports.getTripByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const trip = await Trip.findOne({ shareToken: token })
      .populate('vehicleId', 'name licensePlate category fuelEfficiency')
      .populate('driverId', 'name licenseNumber category');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Invalid or expired trip link.' });
    }

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(410).json({ success: false, message: 'This trip has already been completed or cancelled.' });
    }

    // Mask token in response; expose only what driver needs
    const data = {
      _id: trip._id,
      status: trip.status,
      driverResponse: trip.driverResponse,
      pickupLocation: trip.pickupLocation,
      dropLocation: trip.dropLocation,
      dispatcherNotes: trip.dispatcherNotes,
      distance: trip.distance,
      cargoWeight: trip.cargoWeight,
      startTime: trip.startTime,
      trackingExpiry: trip.trackingExpiry,
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      createdAt: trip.createdAt,
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/driver-trip/:token/accept
 * Driver accepts the trip. Sets driverResponse = Accepted, trackingExpiry = now + 24h.
 */
exports.acceptTrip = async (req, res, next) => {
  try {
    const { token } = req.params;
    const trip = await Trip.findOne({ shareToken: token });

    if (!trip) return res.status(404).json({ success: false, message: 'Invalid or expired trip link.' });
    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ success: false, message: 'Trip is not in a dispatchable state.' });
    }
    if (trip.driverResponse === 'Accepted') {
      return res.status(200).json({ success: true, message: 'Trip already accepted.', data: { driverResponse: 'Accepted', trackingExpiry: trip.trackingExpiry } });
    }
    if (trip.driverResponse === 'Rejected') {
      return res.status(400).json({ success: false, message: 'This trip was already rejected.' });
    }

    const trackingExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await Trip.findByIdAndUpdate(trip._id, {
      driverResponse: 'Accepted',
      trackingExpiry,
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.to(`trip:${trip._id}`).emit('driverAccepted', { tripId: trip._id, trackingExpiry });

    res.json({ success: true, data: { driverResponse: 'Accepted', trackingExpiry } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/driver-trip/:token/reject
 * Driver rejects the trip.
 */
exports.rejectTrip = async (req, res, next) => {
  try {
    const { token } = req.params;
    const trip = await Trip.findOne({ shareToken: token });

    if (!trip) return res.status(404).json({ success: false, message: 'Invalid or expired trip link.' });
    if (trip.driverResponse !== 'Pending') {
      return res.status(400).json({ success: false, message: `Trip already ${trip.driverResponse.toLowerCase()}.` });
    }

    await Trip.findByIdAndUpdate(trip._id, { driverResponse: 'Rejected' });

    const io = req.app.get('io');
    if (io) io.to(`trip:${trip._id}`).emit('driverRejected', { tripId: trip._id });

    res.json({ success: true, data: { driverResponse: 'Rejected' } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/driver-trip/:token/location
 * Driver pushes a GPS coordinate. Token is the auth credential.
 * Body: { lat, lng, accuracy?, speed?, heading? }
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { lat, lng, accuracy, speed, heading } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'lat and lng are required.' });
    }

    const trip = await Trip.findOne({ shareToken: token });
    if (!trip) return res.status(404).json({ success: false, message: 'Invalid trip token.' });
    if (trip.driverResponse !== 'Accepted') {
      return res.status(400).json({ success: false, message: 'Trip not accepted.' });
    }
    if (trip.trackingExpiry && new Date() > trip.trackingExpiry) {
      return res.status(410).json({ success: false, message: 'Tracking session has expired.' });
    }
    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ success: false, message: 'Trip is not active.' });
    }

    // Save to location history
    await LocationUpdate.create({ tripId: trip._id, lat, lng, accuracy, speed, heading });

    // Update last known position on the trip doc (fast lookup for dispatcher)
    await Trip.findByIdAndUpdate(trip._id, {
      lastKnownLat: lat,
      lastKnownLng: lng,
      lastLocationAt: new Date(),
    });

    // Broadcast via Socket.IO to the dispatcher room
    const io = req.app.get('io');
    if (io) {
      io.to(`trip:${trip._id}`).emit('locationUpdate', {
        tripId: trip._id,
        lat,
        lng,
        accuracy,
        speed,
        heading,
        timestamp: new Date(),
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
