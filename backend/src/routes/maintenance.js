const express = require('express');
const { body, param } = require('express-validator');
const {
  getMaintenances,
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} = require('../controllers/maintenanceController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { requireCommunity } = require('../middleware/community');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/roles');

const router = express.Router();
const viewRoles = [ROLES.Manager, ROLES.FinancialAnalyst];

router.use(protect, requireCommunity);

router.get('/', authorizeRoles(...viewRoles), getMaintenances);
router.get('/:id', authorizeRoles(...viewRoles), param('id').isMongoId(), validate, getMaintenance);
router.post(
  '/',
  authorizeRoles(ROLES.Manager),
  [
    body('vehicleId').isMongoId(),
    body('description').trim().notEmpty(),
    body('cost').isFloat({ min: 0 }),
    body('severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  ],
  validate,
  createMaintenance
);
router.put('/:id', authorizeRoles(ROLES.Manager), param('id').isMongoId(), validate, updateMaintenance);
router.delete('/:id', authorizeRoles(ROLES.Manager), param('id').isMongoId(), validate, deleteMaintenance);

module.exports = router;
