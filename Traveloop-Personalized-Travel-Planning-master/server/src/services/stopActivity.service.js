const prisma = require('../config/db');

// ── Select shape ──────────────────────────────────────────────────────────────

const SA_SELECT = {
  id: true,
  stopId: true,
  customName: true,
  startTime: true,
  endTime: true,
  cost: true,
  notes: true,
  location: true,
  orderIndex: true,
  dayOffset: true,
  isLocked: true,
  activity: {
    select: {
      id: true,
      name: true,
      category: true,
      costPerPerson: true,
      durationMinutes: true,
      imageUrl: true,
      rating: true,
      isFree: true,
    },
  },
};

// ── Shared guard helpers ──────────────────────────────────────────────────────

const assertMember = async (tripId, userId) => {
  const membership = await prisma.tripMember.findFirst({ where: { tripId, userId } });
  if (!membership) {
    const err = new Error('You do not have access to this trip');
    err.statusCode = 403;
    throw err;
  }
};

const assertStopBelongsToTrip = async (tripId, stopId) => {
  const stop = await prisma.tripStop.findFirst({ where: { id: stopId, tripId } });
  if (!stop) {
    const err = new Error('Stop not found in this trip');
    err.statusCode = 404;
    throw err;
  }
  return stop;
};

const assertSABelongsToStop = async (stopId, saId) => {
  const sa = await prisma.stopActivity.findFirst({ where: { id: saId, stopId } });
  if (!sa) {
    const err = new Error('Activity not found in this stop');
    err.statusCode = 404;
    throw err;
  }
  return sa;
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Return all activities for a stop.
 * Ordered by dayOffset first, then orderIndex — matches the itinerary day/time grid.
 */
const getStopActivities = async (tripId, stopId, userId) => {
  await assertMember(tripId, userId);
  await assertStopBelongsToTrip(tripId, stopId);

  return prisma.stopActivity.findMany({
    where: { stopId },
    orderBy: [{ dayOffset: 'asc' }, { orderIndex: 'asc' }],
    select: SA_SELECT,
  });
};

/**
 * Add a new activity to a stop.
 * If activityId is provided, verify it exists in the catalog.
 * customName is used only when no catalog activity is linked.
 */
const createStopActivity = async (tripId, stopId, userId, data) => {
  await assertMember(tripId, userId);
  await assertStopBelongsToTrip(tripId, stopId);

  if (data.activityId) {
    const catalogActivity = await prisma.activity.findUnique({ where: { id: data.activityId } });
    if (!catalogActivity) {
      const err = new Error('Catalog activity not found');
      err.statusCode = 404;
      throw err;
    }
  }

  return prisma.stopActivity.create({
    data: {
      stopId,
      activityId:  data.activityId  ?? null,
      customName:  data.customName  ?? null,
      startTime:   data.startTime   ?? null,
      endTime:     data.endTime     ?? null,
      cost:        data.cost        ?? 0,
      notes:       data.notes       ?? null,
      location:    data.location    ?? null,
      orderIndex:  data.orderIndex  ?? 0,
      dayOffset:   data.dayOffset   ?? 0,
    },
    select: SA_SELECT,
  });
};

/**
 * Update a stop activity. Any trip member can edit.
 * Three-level ownership check: trip → stop → activity.
 */
const updateStopActivity = async (tripId, stopId, saId, userId, data) => {
  await assertMember(tripId, userId);
  await assertStopBelongsToTrip(tripId, stopId);
  await assertSABelongsToStop(stopId, saId);

  // If switching to a catalog activity, verify it exists
  if (data.activityId) {
    const catalogActivity = await prisma.activity.findUnique({ where: { id: data.activityId } });
    if (!catalogActivity) {
      const err = new Error('Catalog activity not found');
      err.statusCode = 404;
      throw err;
    }
  }

  return prisma.stopActivity.update({
    where: { id: saId },
    data,
    select: SA_SELECT,
  });
};

/**
 * Delete a stop activity. Any trip member can delete their own activities.
 * Same three-level ownership check for safety.
 */
const deleteStopActivity = async (tripId, stopId, saId, userId) => {
  await assertMember(tripId, userId);
  await assertStopBelongsToTrip(tripId, stopId);
  await assertSABelongsToStop(stopId, saId);

  await prisma.stopActivity.delete({ where: { id: saId } });
};

/**
 * Bulk-update orderIndex for activities within a stop.
 * Validates all IDs belong to the stop before committing.
 * Atomic via $transaction.
 */
const reorderStopActivities = async (tripId, stopId, userId, items) => {
  await assertMember(tripId, userId);
  await assertStopBelongsToTrip(tripId, stopId);

  // Ensure every supplied ID actually belongs to this stop
  const valid = await prisma.stopActivity.findMany({
    where: { stopId, id: { in: items.map((i) => i.id) } },
    select: { id: true },
  });

  if (valid.length !== items.length) {
    const err = new Error('One or more activity IDs do not belong to this stop');
    err.statusCode = 400;
    throw err;
  }

  await prisma.$transaction(
    items.map(({ id, orderIndex }) =>
      prisma.stopActivity.update({ where: { id }, data: { orderIndex } })
    )
  );

  // Return fresh ordered list
  return prisma.stopActivity.findMany({
    where: { stopId },
    orderBy: [{ dayOffset: 'asc' }, { orderIndex: 'asc' }],
    select: SA_SELECT,
  });
};

module.exports = {
  getStopActivities,
  createStopActivity,
  updateStopActivity,
  deleteStopActivity,
  reorderStopActivities,
};
