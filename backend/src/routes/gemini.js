const express = require('express');
const { body, param } = require('express-validator');
const {
  analyzeVehicleRisk,
  financialAdvice,
  naturalLanguageQuery,
} = require('../controllers/geminiController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { requireCommunity } = require('../middleware/community');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/roles');

const router = express.Router();
const allRoles = [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst];

router.use(protect, requireCommunity);
router.get('/vehicle/:id/risk', authorizeRoles(...allRoles), param('id').isMongoId(), validate, analyzeVehicleRisk);
router.get('/financial-advice', authorizeRoles(ROLES.Manager, ROLES.FinancialAnalyst), financialAdvice);
router.post(
  '/query',
  authorizeRoles(...allRoles),
  body('query').trim().notEmpty().withMessage('Query is required'),
  validate,
  naturalLanguageQuery
);

module.exports = router;
