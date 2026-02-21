const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT-based authentication middleware.
 * Expects: Authorization: Bearer <token>
 * On success: sets req.user (without password).
 * Returns 401 if missing/invalid token or user not found.
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized', code: 'UNAUTHORIZED' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found', code: 'UNAUTHORIZED' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token', code: 'UNAUTHORIZED' });
  }
};

/**
 * Reusable authorization middleware: allow only specified roles.
 * Use after protect(). Returns 403 if role not allowed.
 * @param {...string} allowedRoles - Roles that can access the route
 * @example
 *   router.post('/vehicles', protect, authorizeRoles('Manager'), createVehicle);
 */
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized', code: 'UNAUTHORIZED' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied for this role', code: 'FORBIDDEN' });
  }
  next();
};

/** Alias for backward compatibility */
const authorize = authorizeRoles;

module.exports = { protect, authorize, authorizeRoles };
