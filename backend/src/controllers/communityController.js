const Community = require('../models/Community');
const User = require('../models/User');
const Invite = require('../models/Invite');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { ROLES } = require('../config/roles');

exports.getCommunity = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    if (!communityId) {
      return res.status(403).json({ success: false, message: 'No community assigned' });
    }
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ success: false, message: 'Community not found' });
    res.json({ success: true, data: community });
  } catch (err) {
    next(err);
  }
};

exports.updateCommunity = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.Manager || !req.user.isCommunityAdmin) {
      return res.status(403).json({ success: false, message: 'Only community admin can update settings' });
    }
    const communityId = req.user.communityId;
    if (!communityId) return res.status(403).json({ success: false, message: 'No community assigned' });
    const community = await Community.findByIdAndUpdate(communityId, { name: req.body.name }, { new: true, runValidators: true });
    if (!community) return res.status(404).json({ success: false, message: 'Community not found' });
    res.json({ success: true, data: community });
  } catch (err) {
    next(err);
  }
};

exports.getMembers = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    if (!communityId) return res.status(403).json({ success: false, message: 'No community assigned' });
    const members = await User.find({ communityId }).select('-password').sort({ role: 1, name: 1 });
    const roleCounts = { Manager: 0, Dispatcher: 0, SafetyOfficer: 0, FinancialAnalyst: 0 };
    members.forEach((m) => { if (roleCounts[m.role] !== undefined) roleCounts[m.role]++; });
    res.json({
      success: true,
      data: { members, roleCounts },
    });
  } catch (err) {
    next(err);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    if (!communityId) return res.status(403).json({ success: false, message: 'No community assigned' });
    const [community, members, vehicles, drivers] = await Promise.all([
      Community.findById(communityId),
      User.find({ communityId }).select('role'),
      Vehicle.find({ communityId }),
      Driver.find({ communityId }),
    ]);
    const roleCounts = { Manager: 0, Dispatcher: 0, SafetyOfficer: 0, FinancialAnalyst: 0 };
    members.forEach((m) => { if (roleCounts[m.role] !== undefined) roleCounts[m.role]++; });
    res.json({
      success: true,
      data: {
        community,
        totalMembers: members.length,
        roleCounts,
        totalVehicles: vehicles.length,
        totalDrivers: drivers.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.Manager) {
      return res.status(403).json({ success: false, message: 'Only Manager can remove members' });
    }
    const communityId = req.user.communityId;
    if (!communityId) return res.status(403).json({ success: false, message: 'No community assigned' });
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
    if (String(targetUser.communityId) !== String(communityId)) {
      return res.status(403).json({ success: false, message: 'Cannot remove user from another community' });
    }
    if (targetUser.isCommunityAdmin) {
      const adminCount = await User.countDocuments({ communityId, isCommunityAdmin: true });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot remove the last community admin' });
      }
    }
    await User.findByIdAndUpdate(req.params.userId, { communityId: null });
    res.json({ success: true, data: { removed: true } });
  } catch (err) {
    next(err);
  }
};
