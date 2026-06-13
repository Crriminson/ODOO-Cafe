const prisma = require('../config/db');

// ── Shared select shape ───────────────────────────────────────────────────────

const STOP_SELECT = {
  id: true,
  tripId: true,
  orderIndex: true,
  startDate: true,
  endDate: true,
  notes: true,
  createdAt: true,
  city: {
    select: {
      id: true,
      name: true,
      country: true,
      region: true,
      imageUrl: true,
      costIndex: true,
      timezone: true,
      latitude: true,
      longitude: true,
    },
  },
  _count: { select: { activities: true } },
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

/**
 * Assert requesting user is a member of the trip.
 * Returns the membership row on success.
 */
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

/**
 * Assert requesting user is the trip creator (for destructive stop ops).
 */
const assertCreator = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { creatorId: true },
  });
  if (!trip) {
    const err = new Error('Trip not found');
    err.statusCode = 404;
    throw err;
  }
  if (trip.creatorId !== userId) {
    const err = new Error('Only the trip creator can delete stops');
    err.statusCode = 403;
    throw err;
  }
};

/**
 * Verify a stop exists and belongs to the given trip.
 * Prevents cross-trip manipulation via crafted stopIds.
 */
const assertStopBelongsToTrip = async (tripId, stopId) => {
  const stop = await prisma.tripStop.findFirst({
    where: { id: stopId, tripId },
  });
  if (!stop) {
    const err = new Error('Stop not found in this trip');
    err.statusCode = 404;
    throw err;
  }
  return stop;
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Return all stops for a trip, ordered by orderIndex.
 * Includes city info and activity count per stop.
 */
const getStops = async (tripId, userId) => {
  await assertMember(tripId, userId);

  return prisma.tripStop.findMany({
    where: { tripId },
    orderBy: { orderIndex: 'asc' },
    select: STOP_SELECT,
  });
};

/**
 * Append a new stop to a trip.
 * orderIndex = current stop count so it always lands at the end.
 * Supports either an existing cityId OR auto-creating a city from name/country/coords.
 */
const createStop = async (tripId, userId, data) => {
  await assertMember(tripId, userId);

  let cityId = data.cityId;

  // If no cityId, try to find or create the city
  if (!cityId && data.cityName) {
    // Look up by name (case-insensitive)
    let city = await prisma.city.findFirst({
      where: {
        name: { equals: data.cityName, mode: 'insensitive' },
        ...(data.country && { country: { equals: data.country, mode: 'insensitive' } }),
      },
    });

    if (!city) {
      // Create a new city record
      city = await prisma.city.create({
        data: {
          name: data.cityName,
          country: data.country || 'Unknown',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          region: '',
          costIndex: 2,
          popularityScore: 50,
          description: `${data.cityName}, ${data.country || 'Unknown'}`,
          imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(data.cityName)}+travel`,
          timezone: '',
        },
      });
    }

    cityId = city.id;
  }

  // Validate city exists (for the cityId path)
  if (cityId) {
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) {
      const err = new Error('City not found');
      err.statusCode = 404;
      throw err;
    }
  }

  // Determine next order position atomically
  const count = await prisma.tripStop.count({ where: { tripId } });

  const stop = await prisma.tripStop.create({
    data: {
      tripId,
      cityId,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      notes: data.notes ?? null,
      orderIndex: count, // 0-indexed append
    },
    select: STOP_SELECT,
  });

  return stop;
};

/**
 * Update a stop's dates or notes. Any member can edit.
 * Verifies the stop actually belongs to this trip before updating.
 */
const updateStop = async (tripId, stopId, userId, data) => {
  await assertMember(tripId, userId);
  await assertStopBelongsToTrip(tripId, stopId);

  // If cityId is being changed, verify the new city exists
  if (data.cityId) {
    const city = await prisma.city.findUnique({ where: { id: data.cityId } });
    if (!city) {
      const err = new Error('City not found');
      err.statusCode = 404;
      throw err;
    }
  }

  return prisma.tripStop.update({
    where: { id: stopId },
    data,
    select: STOP_SELECT,
  });
};

/**
 * Delete a stop. Creator only.
 * Cascade in the schema removes all StopActivities automatically.
 */
const deleteStop = async (tripId, stopId, userId) => {
  await assertCreator(tripId, userId);
  await assertStopBelongsToTrip(tripId, stopId);

  await prisma.tripStop.delete({ where: { id: stopId } });

  // Re-compact orderIndex values so there are no gaps after deletion.
  // This keeps the sequence clean (0, 1, 2...) for the frontend drag-and-drop.
  const remaining = await prisma.tripStop.findMany({
    where: { tripId },
    orderBy: { orderIndex: 'asc' },
    select: { id: true },
  });

  if (remaining.length > 0) {
    await prisma.$transaction(
      remaining.map((stop, idx) =>
        prisma.tripStop.update({
          where: { id: stop.id },
          data: { orderIndex: idx },
        })
      )
    );
  }
};

/**
 * Bulk-update orderIndex values for stops in a trip.
 * All updates run inside a single transaction — either all succeed or none do.
 * Validates that every supplied id belongs to this trip before writing.
 */
const reorderStops = async (tripId, userId, items) => {
  await assertMember(tripId, userId);

  // Verify all submitted stop IDs belong to this trip in one query
  const validStops = await prisma.tripStop.findMany({
    where: { tripId, id: { in: items.map((i) => i.id) } },
    select: { id: true },
  });

  if (validStops.length !== items.length) {
    const err = new Error('One or more stop IDs do not belong to this trip');
    err.statusCode = 400;
    throw err;
  }

  await prisma.$transaction(
    items.map(({ id, orderIndex }) =>
      prisma.tripStop.update({
        where: { id },
        data: { orderIndex },
      })
    )
  );

  // Return the fresh ordered list after the transaction
  return prisma.tripStop.findMany({
    where: { tripId },
    orderBy: { orderIndex: 'asc' },
    select: STOP_SELECT,
  });
};

module.exports = { getStops, createStop, updateStop, deleteStop, reorderStops };
