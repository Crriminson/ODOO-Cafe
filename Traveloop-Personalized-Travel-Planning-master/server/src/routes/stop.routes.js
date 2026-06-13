const { Router } = require('express');
const stopController      = require('../controllers/stop.controller');
const validate            = require('../middleware/validate.middleware');
const { createStopSchema, updateStopSchema, reorderStopsSchema } = require('../schemas/stop.schema');
const stopActivityRouter  = require('./stopActivity.routes');

// mergeParams: true — makes /:id from the parent trips router available
// as req.params.id inside this nested router
const router = Router({ mergeParams: true });

// Auth is already applied by trip.routes.js before mounting this router

// IMPORTANT: /reorder must be defined before /:stopId, otherwise Express
// would try to match the literal string "reorder" as a stopId UUID.
router.patch('/reorder', validate(reorderStopsSchema), stopController.reorderStops);

router.get('/', stopController.getStops);
router.post('/', validate(createStopSchema), stopController.createStop);
router.put('/:stopId', validate(updateStopSchema), stopController.updateStop);
router.delete('/:stopId', stopController.deleteStop);

// ── Nested router ────────────────────────────────────────────────────────────
router.use('/:stopId/activities', stopActivityRouter);

module.exports = router;
