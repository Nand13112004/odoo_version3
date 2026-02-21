const express = require('express');
const { body, param } = require('express-validator');
const { getFuelLogs, createFuelLog } = require('../controllers/fuelLogController');
const { protect, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

router.get('/', authorizeRoles(ROLES.Manager, ROLES.FinancialAnalyst), getFuelLogs);
router.post(
  '/',
  authorizeRoles(ROLES.Manager),
  [
    body('vehicleId').isMongoId(),
    body('liters').isFloat({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
  ],
  validate,
  createFuelLog
);

module.exports = router;
