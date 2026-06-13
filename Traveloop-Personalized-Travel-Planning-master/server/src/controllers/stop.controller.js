const stopService = require('../services/stop.service');
const apiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/trips/:id/stops
 */
const getStops = async (req, res, next) => {
  try {
    const stops = await stopService.getStops(req.params.id, req.user.id);
    res.status(200).json(apiResponse.success(stops));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/trips/:id/stops
 * Body: { cityId, startDate?, endDate?, notes? }
 */
const createStop = async (req, res, next) => {
  try {
    const stop = await stopService.createStop(req.params.id, req.user.id, req.body);
    res.status(201).json(apiResponse.success(stop, 'Stop added'));
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/trips/:id/stops/:stopId
 */
const updateStop = async (req, res, next) => {
  try {
    const stop = await stopService.updateStop(
      req.params.id,
      req.params.stopId,
      req.user.id,
      req.body
    );
    res.status(200).json(apiResponse.success(stop, 'Stop updated'));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/trips/:id/stops/:stopId
 */
const deleteStop = async (req, res, next) => {
  try {
    await stopService.deleteStop(req.params.id, req.params.stopId, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/trips/:id/stops/reorder
 * Body: { items: [{ id, orderIndex }] }
 */
const reorderStops = async (req, res, next) => {
  try {
    const stops = await stopService.reorderStops(
      req.params.id,
      req.user.id,
      req.body.items
    );
    res.status(200).json(apiResponse.success(stops, 'Stops reordered'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getStops, createStop, updateStop, deleteStop, reorderStops };
