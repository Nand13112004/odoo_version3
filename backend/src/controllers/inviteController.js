const Invite = require('../models/Invite');
const { ROLES } = require('../config/roles');

exports.createInvite = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.Manager) {
      return res.status(403).json({ success: false, message: 'Only Manager can send invites' });
    }
    const communityId = req.user.communityId;
    if (!communityId) return res.status(403).json({ success: false, message: 'No community assigned' });
    const { email, role } = req.body;
    if (!['Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Use: Dispatcher, SafetyOfficer, FinancialAnalyst' });
    }
    const User = require('../models/User');
    const existing = await User.findOne({ email: email.toLowerCase(), communityId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already in this community' });
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const inviteToken = Invite.generateToken();
    const invite = await Invite.create({
      email: email.toLowerCase(),
      role,
      communityId,
      inviteToken,
      expiresAt,
      invitedBy: req.user._id,
    });
    res.status(201).json({
      success: true,
      data: {
        invite: {
          id: invite._id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
          inviteUrl: `${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim()}/register?invite=${inviteToken}`,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getInvites = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.Manager) {
      return res.status(403).json({ success: false, message: 'Only Manager can view invites' });
    }
    const communityId = req.user.communityId;
    if (!communityId) return res.status(403).json({ success: false, message: 'No community assigned' });
    const invites = await Invite.find({ communityId }).populate('invitedBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: invites });
  } catch (err) {
    next(err);
  }
};

exports.validateInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invite = await Invite.findOne({ inviteToken: token, expiresAt: { $gt: new Date() } }).populate('communityId', 'name');
    if (!invite) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invite', valid: false });
    }
    res.json({ success: true, data: { valid: true, email: invite.email, role: invite.role, communityName: invite.communityId?.name } });
  } catch (err) {
    next(err);
  }
};
