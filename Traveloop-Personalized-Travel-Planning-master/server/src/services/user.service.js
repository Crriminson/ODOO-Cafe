const prisma = require('../config/db');

const USER_SAFE_FIELDS = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  languagePref: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Return the authenticated user's own profile.
 * Throws 404 if the user doesn't exist or has been soft-deleted.
 */
const getMe = async (userId) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: USER_SAFE_FIELDS,
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
};

/**
 * Update the authenticated user's own profile.
 * Only name and languagePref are mutable via this endpoint.
 */
const updateMe = async (userId, data) => {
  // Ensure user exists and isn't soft-deleted before updating
  await getMe(userId);

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SAFE_FIELDS,
  });

  return updated;
};

/**
 * Soft-delete the authenticated user's account.
 * Sets deletedAt = now(). All relational data is preserved.
 * The user can no longer log in because login() checks deletedAt.
 */
const deleteMe = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
};

module.exports = { getMe, updateMe, deleteMe };
