const prisma = require('../config/db');
const apiResponse = require('../utils/apiResponse');

exports.getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalTrips = await prisma.trip.count();
    const totalExpenses = await prisma.expense.count();
    const totalCommunities = await prisma.communityPost.count();
    
    // Recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.status(200).json(apiResponse.success({
      stats: { totalUsers, totalTrips, totalExpenses, totalCommunities },
      recentUsers
    }));
  } catch (err) {
    next(err);
  }
};
