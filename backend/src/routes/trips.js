const express = require('express');
const { body, param } = require('express-validator');
const {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} = require('../controllers/tripController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { requireCommunity } = require('../middleware/community');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/roles');

const router = express.Router();
const viewRoles = [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst];

router.use(protect, requireCommunity);

router.get('/', authorizeRoles(...viewRoles), getTrips);
router.get('/:id', authorizeRoles(...viewRoles), param('id').isMongoId(), validate, getTrip);
router.post(
  '/',
  authorizeRoles(ROLES.Dispatcher),
  [
    body('vehicleId').isMongoId(),
    body('driverId').isMongoId(),
    body('cargoWeight').isFloat({ min: 0 }),
    body('distance').isFloat({ min: 0 }),
    body('revenue').optional().isFloat({ min: 0 }),
    body('locationUrl').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  createTrip
);
router.put(
  '/:id',
  authorizeRoles(ROLES.Dispatcher),
  param('id').isMongoId(),
  [body('cargoWeight').optional().isFloat({ min: 0 }), body('distance').optional().isFloat({ min: 0 }), body('revenue').optional().isFloat({ min: 0 })],
  validate,
  updateTrip
);
router.post('/:id/dispatch', authorizeRoles(ROLES.Dispatcher), param('id').isMongoId(), validate, dispatchTrip);
router.post(
  '/:id/complete',
  authorizeRoles(ROLES.Dispatcher),
  param('id').isMongoId(),
  [body('fuelUsed').optional().isFloat({ min: 0 }), body('cost').optional().isFloat({ min: 0 })],
  validate,
  completeTrip
);
router.post('/:id/cancel', authorizeRoles(ROLES.Dispatcher), param('id').isMongoId(), validate, cancelTrip);

module.exports = router;
