const express = require('express');
const { body, param } = require('express-validator');
const { getFuelLogs, createFuelLog, updateFuelLog } = require('../controllers/fuelLogController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { requireCommunity } = require('../middleware/community');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect, requireCommunity);

router.get('/', authorizeRoles(ROLES.Manager, ROLES.FinancialAnalyst, ROLES.Dispatcher), getFuelLogs);
router.post(
  '/',
  authorizeRoles(ROLES.Manager, ROLES.Dispatcher),
  [
    body('vehicleId').isMongoId(),
    body('liters').isFloat({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
  ],
  validate,
  createFuelLog
);
router.put(
  '/:id',
  authorizeRoles(ROLES.Manager),
  param('id').isMongoId(),
  [
    body('liters').optional().isFloat({ min: 0 }),
    body('cost').optional().isFloat({ min: 0 }),
    body('date').optional().isISO8601(),
  ],
  validate,
  updateFuelLog
);

module.exports = router;
