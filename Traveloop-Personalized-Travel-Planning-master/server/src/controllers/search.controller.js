const prisma = require('../config/db');
const apiResponse = require('../utils/apiResponse');

exports.search = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(200).json(apiResponse.success({ cities: [], activities: [] }));
    }

    const query = { contains: q, mode: 'insensitive' };
    
    let cities = [];
    let activities = [];

    if (!type || type === 'city') {
      cities = await prisma.city.findMany({
        where: { OR: [{ name: query }, { country: query }] },
        take: 10
      });
    }

    if (!type || type === 'activity') {
      activities = await prisma.activity.findMany({
        where: { name: query },
        take: 10
      });
    }

    res.status(200).json(apiResponse.success({ cities, activities }));
  } catch (err) {
    next(err);
  }
};

exports.getTopDestinations = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { popularityScore: 'desc' },
      take: 6
    });
    res.status(200).json(apiResponse.success({ cities }));
  } catch (err) {
    next(err);
  }
};

exports.getCityActivities = async (req, res, next) => {
  try {
    const { cityId, category } = req.query;
    if (!cityId) {
      return res.status(200).json(apiResponse.success({ activities: [] }));
    }

    const where = { cityId };
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { rating: 'desc' },
    });

    res.status(200).json(apiResponse.success({ activities }));
  } catch (err) {
    next(err);
  }
};
