import { getAllProducts } from '../db/queries/products.queries.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await getAllProducts();
    res.json({ products });
  } catch (err) {
    next(err);
  }
};
