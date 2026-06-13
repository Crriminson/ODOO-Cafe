const stopActivityService = require('../services/stopActivity.service');
const apiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/trips/:id/stops/:stopId/activities
 */
const getStopActivities = async (req, res, next) => {
  try {
    const activities = await stopActivityService.getStopActivities(
      req.params.id,
      req.params.stopId,
      req.user.id
    );
    res.status(200).json(apiResponse.success(activities));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/trips/:id/stops/:stopId/activities
 */
const createStopActivity = async (req, res, next) => {
  try {
    const activity = await stopActivityService.createStopActivity(
      req.params.id,
      req.params.stopId,
      req.user.id,
      req.body
    );
    res.status(201).json(apiResponse.success(activity, 'Activity added to stop'));
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/trips/:id/stops/:stopId/activities/:saId
 */
const updateStopActivity = async (req, res, next) => {
  try {
    const activity = await stopActivityService.updateStopActivity(
      req.params.id,
      req.params.stopId,
      req.params.saId,
      req.user.id,
      req.body
    );
    res.status(200).json(apiResponse.success(activity, 'Activity updated'));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/trips/:id/stops/:stopId/activities/:saId
 */
const deleteStopActivity = async (req, res, next) => {
  try {
    await stopActivityService.deleteStopActivity(
      req.params.id,
      req.params.stopId,
      req.params.saId,
      req.user.id
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/trips/:id/stops/:stopId/activities/reorder
 * Body: { items: [{ id, orderIndex }] }
 */
const reorderStopActivities = async (req, res, next) => {
  try {
    const activities = await stopActivityService.reorderStopActivities(
      req.params.id,
      req.params.stopId,
      req.user.id,
      req.body.items
    );
    res.status(200).json(apiResponse.success(activities, 'Activities reordered'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStopActivities,
  createStopActivity,
  updateStopActivity,
  deleteStopActivity,
  reorderStopActivities,
};
