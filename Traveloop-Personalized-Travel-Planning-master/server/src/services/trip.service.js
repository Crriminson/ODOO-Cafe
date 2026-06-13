const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// ── Shared select shapes ──────────────────────────────────────────────────────

// Lightweight trip card shape used in list views
const TRIP_LIST_SELECT = {
  id: true,
  name: true,
  description: true,
  coverPhotoUrl: true,
  startDate: true,
  endDate: true,
  status: true,
  isPublic: true,
  totalBudget: true,
  createdAt: true,
  creator: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { stops: true, members: true } },
};

// Full trip shape for detail view
const TRIP_DETAIL_SELECT = {
  id: true,
  name: true,
  description: true,
  coverPhotoUrl: true,
  startDate: true,
  endDate: true,
  status: true,
  isPublic: true,
  shareToken: true,
  totalBudget: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: { id: true, name: true, avatarUrl: true } },
  members: {
    select: {
      id: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true, avatarUrl: true, email: true } },
    },
  },
  stops: {
    orderBy: { orderIndex: 'asc' },
    select: {
      id: true,
      orderIndex: true,
      startDate: true,
      endDate: true,
      notes: true,
      city: { select: { id: true, name: true, country: true, imageUrl: true } },
      activities: {
        orderBy: [{ dayOffset: 'asc' }, { orderIndex: 'asc' }],
        select: {
          id: true,
          customName: true,
          startTime: true,
          endTime: true,
          cost: true,
          notes: true,
          orderIndex: true,
          dayOffset: true,
          isLocked: true,
          activity: {
            select: { id: true, name: true, category: true, costPerPerson: true },
          },
        },
      },
    },
  },
};

// ── Helper: assert user can access a trip ─────────────────────────────────────

const assertMember = async (tripId, userId) => {
  const membership = await prisma.tripMember.findFirst({
    where: { tripId, userId },
  });
  if (!membership) {
    const err = new Error('You do not have access to this trip');
    err.statusCode = 403;
    throw err;
  }
  return membership;
};

const assertCreator = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { creatorId: true } });
  if (!trip) {
    const err = new Error('Trip not found');
    err.statusCode = 404;
    throw err;
  }
  if (trip.creatorId !== userId) {
    const err = new Error('Only the trip creator can perform this action');
    err.statusCode = 403;
    throw err;
  }
  return trip;
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Return all trips the user created or is a member of.
 * Includes stop count and member count on each card.
 */
const getTrips = async (userId) => {
  const trips = await prisma.trip.findMany({
    where: {
      members: { some: { userId } },
    },
    select: TRIP_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
  });
  return trips;
};

/**
 * Return full trip detail.
 * Throws 403 if the requesting user is not a member.
 */
const getTripById = async (tripId, userId) => {
  // Membership check first — avoids leaking existence of private trips
  await assertMember(tripId, userId);

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: TRIP_DETAIL_SELECT,
  });

  if (!trip) {
    const err = new Error('Trip not found');
    err.statusCode = 404;
    throw err;
  }

  return trip;
};

/**
 * Create a trip and immediately add the creator as OWNER member.
 * Uses a transaction so both writes succeed or neither does.
 */
const createTrip = async (userId, data) => {
  const trip = await prisma.$transaction(async (tx) => {
    const newTrip = await tx.trip.create({
      data: { ...data, creatorId: userId },
    });

    await tx.tripMember.create({
      data: { tripId: newTrip.id, userId, role: 'OWNER' },
    });

    return newTrip;
  });

  // Return full detail shape
  return prisma.trip.findUnique({ where: { id: trip.id }, select: TRIP_DETAIL_SELECT });
};

/**
 * Update trip metadata. Creator only.
 */
const updateTrip = async (tripId, userId, data) => {
  await assertCreator(tripId, userId);

  return prisma.trip.update({
    where: { id: tripId },
    data,
    select: TRIP_DETAIL_SELECT,
  });
};

/**
 * Hard delete trip. Creator only.
 * Cascades handle stops, activities, expenses, members, notes, packing items.
 */
const deleteTrip = async (tripId, userId) => {
  await assertCreator(tripId, userId);
  await prisma.trip.delete({ where: { id: tripId } });
};

/**
 * Flip isPublic. If making public, regenerate shareToken for a fresh URL.
 * If making private, keep the existing token (it just won't be usable).
 */
const toggleShare = async (tripId, userId) => {
  await assertCreator(tripId, userId);

  const current = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { isPublic: true },
  });

  const willBePublic = !current.isPublic;

  return prisma.trip.update({
    where: { id: tripId },
    data: {
      isPublic: willBePublic,
      // Fresh token every time sharing is enabled — invalidates old links
      ...(willBePublic && { shareToken: uuidv4() }),
    },
    select: {
      id: true,
      isPublic: true,
      shareToken: true,
    },
  });
};

/**
 * Public read — no auth required.
 * Returns trip with stops + activities only if isPublic = true.
 */
const getTripByShareToken = async (token) => {
  const trip = await prisma.trip.findFirst({
    where: { shareToken: token, isPublic: true },
    select: TRIP_DETAIL_SELECT,
  });

  if (!trip) {
    const err = new Error('Shared trip not found or is no longer public');
    err.statusCode = 404;
    throw err;
  }

  return trip;
};

/**
 * Deep-clone a trip: duplicates the trip row, all TripStops, and all
 * StopActivities. The clone is owned by userId and always starts as PLANNING.
 * Uses a transaction so the clone is atomic.
 */
const cloneTrip = async (tripId, userId) => {
  // Any member can clone (not just the creator)
  await assertMember(tripId, userId);

  const original = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      stops: {
        include: { activities: true },
      },
    },
  });

  if (!original) {
    const err = new Error('Trip not found');
    err.statusCode = 404;
    throw err;
  }

  const cloned = await prisma.$transaction(async (tx) => {
    // Create the cloned trip
    const newTrip = await tx.trip.create({
      data: {
        creatorId: userId,
        name: `Copy of ${original.name}`,
        description: original.description,
        coverPhotoUrl: original.coverPhotoUrl,
        startDate: original.startDate,
        endDate: original.endDate,
        totalBudget: original.totalBudget,
        status: 'PLANNING',
        isPublic: false,
      },
    });

    // OWNER membership for the cloner
    await tx.tripMember.create({
      data: { tripId: newTrip.id, userId, role: 'OWNER' },
    });

    // Clone each stop, preserving order
    for (const stop of original.stops) {
      const newStop = await tx.tripStop.create({
        data: {
          tripId: newTrip.id,
          cityId: stop.cityId,
          orderIndex: stop.orderIndex,
          startDate: stop.startDate,
          endDate: stop.endDate,
          notes: stop.notes,
        },
      });

      // Clone all activities for this stop
      if (stop.activities.length > 0) {
        await tx.stopActivity.createMany({
          data: stop.activities.map((a) => ({
            stopId: newStop.id,
            activityId: a.activityId,
            customName: a.customName,
            startTime: a.startTime,
            endTime: a.endTime,
            cost: a.cost,
            notes: a.notes,
            orderIndex: a.orderIndex,
            dayOffset: a.dayOffset,
            isLocked: false, // Reset lock state in the clone
          })),
        });
      }
    }

    return newTrip;
  });

  return prisma.trip.findUnique({ where: { id: cloned.id }, select: TRIP_DETAIL_SELECT });
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
