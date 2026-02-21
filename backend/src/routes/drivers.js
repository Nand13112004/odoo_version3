const express = require('express');
const { body, param } = require('express-validator');
const {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  updateDriverStatus,
  deleteDriver,
} = require('../controllers/driverController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { requireCommunity } = require('../middleware/community');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/roles');

const router = express.Router();
const viewRoles = [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst];

router.use(protect, requireCommunity);

router.get('/', authorizeRoles(...viewRoles), getDrivers);
router.get('/:id', authorizeRoles(...viewRoles), param('id').isMongoId(), validate, getDriver);
router.post(
  '/',
  authorizeRoles(ROLES.Manager),
  [
    body('name').trim().notEmpty(),
    body('licenseNumber').trim().notEmpty(),
    body('licenseExpiry').isISO8601(),
    body('safetyScore').optional().isFloat({ min: 0, max: 100 }),
    body('category').optional().isIn(['Truck', 'Van', 'Bike']),
    body('status').optional().isIn(['On Duty', 'Off Duty', 'Suspended', 'On Trip']),
  ],
  validate,
  createDriver
);
router.put(
  '/:id',
  authorizeRoles(ROLES.Manager),
  param('id').isMongoId(),
  validate,
  updateDriver
);
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.Manager, ROLES.SafetyOfficer),
  param('id').isMongoId(),
  body('status').isIn(['On Duty', 'Off Duty', 'Suspended', 'On Trip']),
  validate,
  updateDriverStatus
);
router.delete('/:id', authorizeRoles(ROLES.Manager), param('id').isMongoId(), validate, deleteDriver);

module.exports = router;
