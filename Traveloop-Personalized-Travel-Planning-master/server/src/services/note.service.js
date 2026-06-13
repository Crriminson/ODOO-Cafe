const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const tripService = require('./trip.service');

exports.getNotes = async (tripId, userId) => {
  await tripService.getTripById(tripId, userId); // verify access
  return prisma.tripNote.findMany({ where: { tripId }, orderBy: { createdAt: 'desc' } });
};

exports.createNote = async (userId, data) => {
  await tripService.getTripById(data.tripId, userId);
  return prisma.tripNote.create({ data: { ...data, userId } });
};

exports.updateNote = async (id, userId, data) => {
  const note = await prisma.tripNote.findUnique({ where: { id } });
  if (!note) throw new AppError('Note not found', 404);
  if (note.userId !== userId) throw new AppError('Not authorized to update this note', 403);
  return prisma.tripNote.update({ where: { id }, data });
};

exports.deleteNote = async (id, userId) => {
  const note = await prisma.tripNote.findUnique({ where: { id } });
  if (!note) throw new AppError('Note not found', 404);
  if (note.userId !== userId) throw new AppError('Not authorized to delete this note', 403);
  return prisma.tripNote.delete({ where: { id } });
};
