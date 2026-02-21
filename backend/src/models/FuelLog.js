const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  liters: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('FuelLog', fuelLogSchema);
