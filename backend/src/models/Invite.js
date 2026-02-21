const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'],
    },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    inviteToken: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

inviteSchema.index({ inviteToken: 1 });
inviteSchema.index({ communityId: 1, email: 1 });

inviteSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('Invite', inviteSchema);
