const express = require('express');
const { exportVehiclesCsv, exportTripsCsv, exportReportPdf } = require('../controllers/exportController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { requireCommunity } = require('../middleware/community');
const { ROLES } = require('../config/roles');

const router = express.Router();
router.use(protect, requireCommunity);
router.get('/vehicles/csv', authorizeRoles(ROLES.Manager, ROLES.FinancialAnalyst), exportVehiclesCsv);
router.get('/trips/csv', authorizeRoles(ROLES.Manager, ROLES.FinancialAnalyst), exportTripsCsv);
router.get('/report/pdf', authorizeRoles(ROLES.Manager, ROLES.FinancialAnalyst), exportReportPdf);

module.exports = router;
