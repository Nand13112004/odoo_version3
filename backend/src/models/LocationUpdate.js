const mongoose = require('mongoose');

/**
 * Stores individual GPS pings from a driver during an active trip.
 * tripId + timestamp indexed for fast last-location lookup.
 */
const locationUpdateSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracy: { type: Number, default: null }, // metres
  speed: { type: Number, default: null },    // m/s
  heading: { type: Number, default: null },  // degrees
  timestamp: { type: Date, default: Date.now, index: true },
});

// TTL: auto-delete location pings older than 7 days
locationUpdateSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('LocationUpdate', locationUpdateSchema);
