const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  description: { type: String, required: true },
  cost: { type: Number, required: true, min: 0 },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  date: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
