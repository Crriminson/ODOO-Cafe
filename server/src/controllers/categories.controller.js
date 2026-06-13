import { getAllCategories } from '../db/queries/categories.queries.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};
