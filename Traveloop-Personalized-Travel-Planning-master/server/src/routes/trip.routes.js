const { Router } = require('express');
const tripController = require('../controllers/trip.controller');
const authMiddleware  = require('../middleware/auth.middleware');
const validate        = require('../middleware/validate.middleware');
const { createTripSchema, updateTripSchema } = require('../schemas/trip.schema');
const stopRouter      = require('./stop.routes');

const router = Router();

// ── Public route — no auth ────────────────────────────────────────────────────
// Must be defined BEFORE router.use(authMiddleware) so it isn't gated.
// The :token param is a UUID so it won't collide with /:id routes.
router.get('/shared/:token', tripController.getTripByShareToken);

// ── All routes below require authentication ───────────────────────────────────
router.use(authMiddleware);

router.get('/', tripController.getTrips);
router.post('/', validate(createTripSchema), tripController.createTrip);

router.get('/:id', tripController.getTripById);
router.put('/:id', validate(updateTripSchema), tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

router.put('/:id/share', tripController.toggleShare);
router.post('/:id/clone', tripController.cloneTrip);

// ── Nested routers ────────────────────────────────────────────────────────────
// Auth is already applied above via router.use(authMiddleware), so the nested
// stop router inherits authentication automatically.
router.use('/:id/stops', stopRouter);

module.exports = router;
