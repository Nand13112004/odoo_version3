const express = require('express');
const { body, param } = require('express-validator');
const {
  getTripByToken,
  acceptTrip,
  rejectTrip,
  updateLocation,
} = require('../controllers/driverTripController');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes are PUBLIC — the shareToken itself is the credential.

// GET /api/driver-trip/:token — fetch trip details
router.get('/:token', getTripByToken);

// POST /api/driver-trip/:token/accept
router.post('/:token/accept', acceptTrip);

// POST /api/driver-trip/:token/reject
router.post('/:token/reject', rejectTrip);

// POST /api/driver-trip/:token/location
router.post(
  '/:token/location',
  [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('accuracy').optional().isFloat({ min: 0 }),
    body('speed').optional().isFloat({ min: 0 }),
    body('heading').optional().isFloat({ min: 0, max: 360 }),
  ],
  validate,
  updateLocation
);

module.exports = router;
