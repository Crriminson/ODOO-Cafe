const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const tripService = require('./trip.service');

exports.getExpenses = async (tripId, userId) => {
  await tripService.getTripById(tripId, userId); // verify access
  
  // Get direct expenses
  const expenses = await prisma.expense.findMany({ where: { tripId }, orderBy: { createdAt: 'desc' } });
  
  // Get stop activities with costs
  const stops = await prisma.tripStop.findMany({
    where: { tripId },
    include: {
      activities: {
        where: { cost: { gt: 0 } },
        include: { activity: true }
      }
    }
  });
  
  // Map stop activities to expense format
  const activityExpenses = [];
  stops.forEach(stop => {
    stop.activities.forEach(sa => {
      activityExpenses.push({
        id: `sa-${sa.id}`,
        tripId,
        stopId: stop.id,
        category: 'ACTIVITIES',
        amount: sa.cost,
        description: sa.customName || sa.activity?.name || 'Activity',
        date: stop.startDate,
        createdAt: new Date(),
        isActivity: true // Flag to show it's derived
      });
    });
  });
  
  return [...expenses, ...activityExpenses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};
exports.createExpense = async (userId, data) => {
  await tripService.getTripById(data.tripId, userId);
  return prisma.expense.create({ data });
};

exports.updateExpense = async (id, userId, data) => {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new AppError('Expense not found', 404);
  await tripService.getTripById(expense.tripId, userId);
  return prisma.expense.update({ where: { id }, data });
};

exports.deleteExpense = async (id, userId) => {
  if (id.startsWith('sa-')) {
    throw new AppError('Cannot delete an activity cost from the budget page. Please edit the activity in the planner.', 400);
  }
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new AppError('Expense not found', 404);
  await tripService.getTripById(expense.tripId, userId);
  return prisma.expense.delete({ where: { id } });
};
