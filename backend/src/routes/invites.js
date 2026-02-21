const express = require('express');
const { body, param } = require('express-validator');
const { createInvite, getInvites, validateInvite } = require('../controllers/inviteController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { requireCommunity } = require('../middleware/community');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.get('/validate/:token', validateInvite);

router.use(protect, requireCommunity);
router.post(
  '/',
  authorizeRoles(ROLES.Manager),
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('role').isIn(['Dispatcher', 'SafetyOfficer', 'FinancialAnalyst']).withMessage('Invalid role'),
  ],
  validate,
  createInvite
);
router.get('/', authorizeRoles(ROLES.Manager), getInvites);

module.exports = router;
