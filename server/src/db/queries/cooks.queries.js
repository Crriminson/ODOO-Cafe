import { db } from '../../config/db.js';

/**
 * Fetch all cooks with their preferred category IDs nested.
 */
export const getAllCooks = async () => {
  const cooks = await db('cooks').select('*').orderBy('id', 'asc');
  
  // Fetch category preferences for all cooks
  const prefs = await db('cook_category_preferences').select('*');
  
  const cooksWithPrefs = cooks.map(cook => {
    const cookPrefs = prefs
      .filter(p => p.cook_id === cook.id)
      .map(p => p.category_id);
    return { ...cook, category_ids: cookPrefs };
  });

  return { rows: cooksWithPrefs };
};

/**
 * Fetch a single cook by id.
 */
export const getCookById = async (id) => {
  const cooks = await db('cooks').where({ id }).select('*').limit(1);
  if (cooks.length === 0) return null;
  
  const prefs = await db('cook_category_preferences')
    .where({ cook_id: id })
    .select('category_id');

  const categoryIds = prefs.map(p => p.category_id);
  return { ...cooks[0], category_ids: categoryIds };
};

/**
 * Create a new cook profile with optional category preferences.
 */
export const createCook = async (name, categoryIds = []) => {
  return db.transaction(async (trx) => {
    const [cook] = await trx('cooks')
      .insert({ name, is_active: true })
      .returning('*');
    
    if (categoryIds.length > 0) {
      const prefs = categoryIds.map(catId => ({
        cook_id: cook.id,
        category_id: catId
      }));
      await trx('cook_category_preferences').insert(prefs);
    }

    return { ...cook, category_ids: categoryIds };
  });
};

/**
 * Update an existing cook profile.
 */
export const updateCook = async (id, { name, is_active, categoryIds }) => {
  return db.transaction(async (trx) => {
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (is_active !== undefined) updateFields.is_active = is_active;
    updateFields.updated_at = trx.fn.now();

    const [cook] = await trx('cooks')
      .where({ id })
      .update(updateFields)
      .returning('*');

    if (!cook) return null;

    if (categoryIds !== undefined) {
      await trx('cook_category_preferences').where({ cook_id: id }).del();
      if (categoryIds.length > 0) {
        const prefs = categoryIds.map(catId => ({
          cook_id: id,
          category_id: catId
        }));
        await trx('cook_category_preferences').insert(prefs);
      }
    }

    const currentPrefs = categoryIds !== undefined 
      ? categoryIds 
      : (await trx('cook_category_preferences').where({ cook_id: id }).select('category_id')).map(p => p.category_id);

    return { ...cook, category_ids: currentPrefs };
  });
};

/**
 * Hard-delete a cook profile and their preferences.
 */
export const deleteCook = async (id) => {
  return db.transaction(async (trx) => {
    await trx('cook_category_preferences').where({ cook_id: id }).del();
    const count = await trx('cooks').where({ id }).del();
    return count > 0;
  });
};
