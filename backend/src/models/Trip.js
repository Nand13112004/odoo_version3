const mongoose = require('mongoose');

const locationPointSchema = new mongoose.Schema({
  address: { type: String, trim: true, default: '' },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
}, { _id: false });

const tripSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  cargoWeight: { type: Number, required: true, min: 0 },
  distance: { type: Number, required: true, min: 0 },
  revenue: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft',
  },
  fuelUsed: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  startTime: { type: Date },
  endTime: { type: Date },
  locationUrl: { type: String, trim: true },
  // Driver trip link sharing
  shareToken: { type: String, unique: true, sparse: true, index: true },
  shareTokenGeneratedAt: { type: Date },
  driverResponse: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  // Trip location info
  pickupLocation: { type: locationPointSchema, default: () => ({}) },
  dropLocation: { type: locationPointSchema, default: () => ({}) },
  dispatcherNotes: { type: String, trim: true, default: '' },
  // Live tracking
  trackingExpiry: { type: Date },
  lastKnownLat: { type: Number, default: null },
  lastKnownLng: { type: Number, default: null },
  lastLocationAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
