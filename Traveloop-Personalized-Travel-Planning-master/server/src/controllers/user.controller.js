const userService = require('../services/user.service');
const apiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/users/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    res.status(200).json(apiResponse.success(user));
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/users/me
 * Body: { name?, languagePref? }
 */
const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateMe(req.user.id, req.body);
    res.status(200).json(apiResponse.success(user, 'Profile updated'));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/users/me
 * Soft-deletes the account. Returns 204 (no body).
 */
const deleteMe = async (req, res, next) => {
  try {
    await userService.deleteMe(req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe, deleteMe };
