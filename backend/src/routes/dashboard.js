const express = require('express');
const { getStats, getCharts } = require('../controllers/dashboardController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

const router = express.Router();
const dashboardStatsRoles = [ROLES.Manager, ROLES.Dispatcher, ROLES.SafetyOfficer, ROLES.FinancialAnalyst];
const analyticsRoles = [ROLES.Manager, ROLES.FinancialAnalyst];

router.use(protect);
router.get('/stats', authorizeRoles(...dashboardStatsRoles), getStats);
router.get('/charts', authorizeRoles(...analyticsRoles), getCharts);

module.exports = router;
