const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  name: { type: String, required: true, trim: true },
  licenseNumber: { type: String, required: true, trim: true },
  licenseExpiry: { type: Date, required: true },
  safetyScore: { type: Number, default: 100, min: 0, max: 100 },
  category: { type: String, enum: ['Truck', 'Van', 'Bike'], default: 'Truck' },
  status: {
    type: String,
    required: true,
    enum: ['On Duty', 'Off Duty', 'Suspended', 'On Trip'],
    default: 'Off Duty',
  },
}, { timestamps: true });

driverSchema.virtual('isLicenseExpired').get(function () {
  return this.licenseExpiry && new Date(this.licenseExpiry) < new Date();
});

driverSchema.set('toJSON', { virtuals: true });
driverSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Driver', driverSchema);
