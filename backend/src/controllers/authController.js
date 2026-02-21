const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Community = require('../models/Community');
const Invite = require('../models/Invite');
const { ROLES } = require('../config/roles');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

function userResponse(user, communityName) {
  const cid = user.communityId?._id || user.communityId;
  const cname = communityName ?? user.communityId?.name;
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    communityId: cid,
    communityName: cname,
    isCommunityAdmin: user.isCommunityAdmin,
  };
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, communityName, inviteToken } = req.body;

    if (role === ROLES.Manager) {
      if (!communityName || !communityName.trim()) {
        return res.status(400).json({ success: false, message: 'Community/company name is required for Manager registration' });
      }
      const community = await Community.create({ name: communityName.trim(), createdBy: null });
      const user = await User.create({
        name,
        email,
        password,
        role,
        communityId: community._id,
        isCommunityAdmin: true,
      });
      community.createdBy = user._id;
      await community.save();
      const token = generateToken(user._id);
      const populated = await User.findById(user._id).populate('communityId', 'name');
      const u = populated || user;
      res.status(201).json({
        success: true,
        data: { token, user: userResponse(u, communityName.trim()) },
      });
      return;
    }

    if (!inviteToken) {
      return res.status(400).json({ success: false, message: 'Invite token is required. Only Managers can register without an invite.' });
    }
    const invite = await Invite.findOne({ inviteToken, expiresAt: { $gt: new Date() } }).populate('communityId');
    if (!invite) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invite token' });
    }
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Email does not match the invite' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: invite.role,
      communityId: invite.communityId._id,
      isCommunityAdmin: false,
    });
    await Invite.deleteOne({ _id: invite._id });
    const token = generateToken(user._id);
    const populated = await User.findById(user._id).populate('communityId', 'name');
    const u = populated || user;
    res.status(201).json({
      success: true,
      data: { token, user: userResponse(u) },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password').populate('communityId', 'name');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    const u = user.toObject ? user.toObject() : user;
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: u._id,
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          communityId: u.communityId?._id || u.communityId,
          communityName: u.communityId?.name,
          isCommunityAdmin: u.isCommunityAdmin,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('communityId', 'name').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          communityId: user.communityId?._id || user.communityId,
          communityName: user.communityId?.name,
          isCommunityAdmin: user.isCommunityAdmin,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
