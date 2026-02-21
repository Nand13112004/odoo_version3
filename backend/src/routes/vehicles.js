const express = require('express');
const { body, param } = require('express-validator');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleROI,
} = require('../controllers/vehicleController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { requireCommunity } = require('../middleware/community');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/roles');

const router = express.Router();
const viewRoles = [ROLES.Manager, ROLES.Dispatcher, ROLES.FinancialAnalyst];

router.use(protect, requireCommunity);

router.get('/', authorizeRoles(...viewRoles), getVehicles);
router.get('/:id', authorizeRoles(...viewRoles), param('id').isMongoId(), validate, getVehicle);
router.get('/:id/roi', authorizeRoles(...viewRoles), param('id').isMongoId(), validate, getVehicleROI);
router.post(
  '/',
  authorizeRoles(ROLES.Manager),
  [
    body('name').trim().notEmpty(),
    body('licensePlate').trim().notEmpty(),
    body('capacity').isFloat({ min: 0 }),
    body('acquisitionCost').isFloat({ min: 0 }),
    body('fuelEfficiency').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['Available', 'On Trip', 'In Shop', 'Retired']),
  ],
  validate,
  createVehicle
);
router.put(
  '/:id',
  authorizeRoles(ROLES.Manager),
  param('id').isMongoId(),
  validate,
  updateVehicle
);
router.delete('/:id', authorizeRoles(ROLES.Manager), param('id').isMongoId(), validate, deleteVehicle);

module.exports = router;
