const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const tripService = require('./trip.service');

exports.getPackingItems = async (tripId, userId) => {
  await tripService.getTripById(tripId, userId); // verify access
  return prisma.packingItem.findMany({ where: { tripId }, orderBy: { createdAt: 'asc' } });
};

exports.createPackingItem = async (userId, data) => {
  await tripService.getTripById(data.tripId, userId);
  return prisma.packingItem.create({ data });
};

exports.updatePackingItem = async (id, userId, data) => {
  const item = await prisma.packingItem.findUnique({ where: { id } });
  if (!item) throw new AppError('Item not found', 404);
  await tripService.getTripById(item.tripId, userId);
  return prisma.packingItem.update({ where: { id }, data });
};

exports.deletePackingItem = async (id, userId) => {
  const item = await prisma.packingItem.findUnique({ where: { id } });
  if (!item) throw new AppError('Item not found', 404);
  await tripService.getTripById(item.tripId, userId);
  return prisma.packingItem.delete({ where: { id } });
};
