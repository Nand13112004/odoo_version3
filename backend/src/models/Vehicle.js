const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  name: { type: String, required: true, trim: true },
  licensePlate: { type: String, required: true, trim: true, uppercase: true },
  capacity: { type: Number, required: true, min: 0 }, // kg
  odometer: { type: Number, default: 0, min: 0 },
  acquisitionCost: { type: Number, required: true, min: 0 },
  fuelEfficiency: { type: Number, default: 0 }, // km per liter
  status: {
    type: String,
    required: true,
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
    default: 'Available',
  },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  totalRevenue: { type: Number, default: 0 },
  totalMaintenanceCost: { type: Number, default: 0 },
  totalFuelCost: { type: Number, default: 0 },
}, { timestamps: true });

vehicleSchema.virtual('roi').get(function () {
  if (!this.acquisitionCost || this.acquisitionCost === 0) return 0;
  const net = this.totalRevenue - (this.totalMaintenanceCost + this.totalFuelCost);
  return (net / this.acquisitionCost) * 100;
});

vehicleSchema.index({ communityId: 1, licensePlate: 1 }, { unique: true });

vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
