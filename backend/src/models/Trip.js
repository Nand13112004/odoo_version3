const mongoose = require('mongoose');

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
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
