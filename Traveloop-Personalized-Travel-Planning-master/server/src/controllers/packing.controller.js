const packingService = require('../services/packing.service');
const apiResponse = require('../utils/apiResponse');

exports.getPackingItems = async (req, res, next) => {
  try {
    const items = await packingService.getPackingItems(req.params.tripId, req.user.id);
    res.status(200).json(apiResponse.success(items));
  } catch (err) {
    next(err);
  }
};

exports.createPackingItem = async (req, res, next) => {
  try {
    const item = await packingService.createPackingItem(req.user.id, req.body);
    res.status(201).json(apiResponse.success(item, 'Item added'));
  } catch (err) {
    next(err);
  }
};

exports.updatePackingItem = async (req, res, next) => {
  try {
    const item = await packingService.updatePackingItem(req.params.id, req.user.id, req.body);
    res.status(200).json(apiResponse.success(item, 'Item updated'));
  } catch (err) {
    next(err);
  }
};

exports.deletePackingItem = async (req, res, next) => {
  try {
    await packingService.deletePackingItem(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
