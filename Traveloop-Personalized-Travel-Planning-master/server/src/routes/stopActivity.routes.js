const { Router } = require('express');
const stopActivityController = require('../controllers/stopActivity.controller');
const validate = require('../middleware/validate.middleware');
const {
  createStopActivitySchema,
  updateStopActivitySchema,
  reorderStopActivitiesSchema,
} = require('../schemas/stopActivity.schema');

// mergeParams: true — inherits :id (tripId) from trips router
// and :stopId from stops router
const router = Router({ mergeParams: true });

// Auth is already applied by the trips router — no need to re-apply here.

// IMPORTANT: /reorder must be declared before /:saId to prevent Express
// from treating the literal string "reorder" as a saId UUID.
router.patch('/reorder', validate(reorderStopActivitiesSchema), stopActivityController.reorderStopActivities);

router.get('/', stopActivityController.getStopActivities);
router.post('/', validate(createStopActivitySchema), stopActivityController.createStopActivity);
router.put('/:saId', validate(updateStopActivitySchema), stopActivityController.updateStopActivity);
router.delete('/:saId', stopActivityController.deleteStopActivity);

module.exports = router;
