const Driver = require('../models/Driver');

exports.getDrivers = async (req, res, next) => {
  try {
    const communityId = req.user.communityId;
    const now = new Date();
    await Driver.updateMany(
      { communityId, licenseExpiry: { $lt: now }, status: { $ne: 'Suspended' } },
      { $set: { status: 'Suspended' } }
    );
    const drivers = await Driver.find({ communityId }).sort({ createdAt: -1 });
    res.json({ success: true, data: drivers });
  } catch (err) {
    next(err);
  }
};

exports.getDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, communityId: req.user.communityId });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
};

exports.createDriver = async (req, res, next) => {
  try {
    const driver = await Driver.create({ ...req.body, communityId: req.user.communityId });
    res.status(201).json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
};

exports.updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findOneAndUpdate(
      { _id: req.params.id, communityId: req.user.communityId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
};

exports.updateDriverStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['On Duty', 'Off Duty', 'Suspended', 'On Trip'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Use: On Duty, Off Duty, Suspended, On Trip' });
    }
    const driver = await Driver.findOne({ _id: req.params.id, communityId: req.user.communityId });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    // Block setting to duty if license expired
    if ((status === 'On Duty' || status === 'On Trip') && driver.licenseExpiry && new Date(driver.licenseExpiry) < new Date()) {
      return res.status(403).json({ success: false, message: 'Driver license expired - cannot set to duty. Update license or keep Suspended.' });
    }
    const updated = await Driver.findOneAndUpdate(
      { _id: req.params.id, communityId: req.user.communityId },
      { status },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findOneAndDelete({ _id: req.params.id, communityId: req.user.communityId });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
