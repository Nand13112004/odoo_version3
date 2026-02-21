const express = require('express');
const { body, param } = require('express-validator');
const {
  getCommunity,
  updateCommunity,
  getMembers,
  getDashboard,
  removeMember,
} = require('../controllers/communityController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { requireCommunity } = require('../middleware/community');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/roles');

const router = express.Router();
router.use(protect, requireCommunity);

router.get('/', getCommunity);
router.get('/dashboard', authorizeRoles(ROLES.Manager), getDashboard);
router.get('/members', authorizeRoles(ROLES.Manager), getMembers);
router.put('/', authorizeRoles(ROLES.Manager), body('name').trim().notEmpty(), validate, updateCommunity);
router.delete('/members/:userId', authorizeRoles(ROLES.Manager), param('userId').isMongoId(), validate, removeMember);

module.exports = router;
