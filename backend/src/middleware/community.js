/**
 * Multi-tenant community isolation middleware.
 * - requireCommunity: User must have communityId (blocks SuperAdmin/platform users without community)
 * - validateCommunityResource: Resource's communityId must match user's communityId
 */

const requireCommunity = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized', code: 'UNAUTHORIZED' });
  }
  if (!req.user.communityId) {
    return res.status(403).json({ success: false, message: 'No community assigned. Access denied.', code: 'FORBIDDEN' });
  }
  next();
};

/**
 * Validate that a resource belongs to the user's community.
 * @param {Object} resource - Document with communityId
 * @returns boolean
 */
const belongsToCommunity = (user, resource) => {
  if (!user?.communityId || !resource?.communityId) return false;
  return String(user.communityId) === String(resource.communityId);
};

/**
 * Returns 403 if resource does not belong to user's community.
 */
const validateCommunityResource = (resource) => (req, res, next) => {
  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }
  if (!belongsToCommunity(req.user, resource)) {
    return res.status(403).json({ success: false, message: 'Access denied. Resource does not belong to your community.', code: 'FORBIDDEN' });
  }
  next();
};

module.exports = { requireCommunity, belongsToCommunity, validateCommunityResource };
