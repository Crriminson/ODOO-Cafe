const tripService = require('../services/trip.service');
const apiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/trips
 */
const getTrips = async (req, res, next) => {
  try {
    const trips = await tripService.getTrips(req.user.id);
    res.status(200).json(apiResponse.success(trips));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/trips/:id
 */
const getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user.id);
    res.status(200).json(apiResponse.success(trip));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/trips
 * Body: { name, description?, startDate?, endDate?, totalBudget? }
 */
const createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.user.id, req.body);
    res.status(201).json(apiResponse.success(trip, 'Trip created'));
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/trips/:id
 */
const updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.user.id, req.body);
    res.status(200).json(apiResponse.success(trip, 'Trip updated'));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/trips/:id
 */
const deleteTrip = async (req, res, next) => {
  try {
    await tripService.deleteTrip(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/trips/:id/share
 */
const toggleShare = async (req, res, next) => {
  try {
    const result = await tripService.toggleShare(req.params.id, req.user.id);
    const msg = result.isPublic ? 'Trip is now public' : 'Trip is now private';
    res.status(200).json(apiResponse.success(result, msg));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/trips/shared/:token  (no auth)
 */
const getTripByShareToken = async (req, res, next) => {
  try {
    const trip = await tripService.getTripByShareToken(req.params.token);
    res.status(200).json(apiResponse.success(trip));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/trips/:id/clone
 */
const cloneTrip = async (req, res, next) => {
  try {
    const trip = await tripService.cloneTrip(req.params.id, req.user.id);
    res.status(201).json(apiResponse.success(trip, 'Trip cloned successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  toggleShare,
  getTripByShareToken,
  cloneTrip,
};
