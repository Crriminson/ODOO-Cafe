import { db } from '../../config/db.js';

/**
 * Search customers by name, email, or phone.
 */
export const searchCustomers = async (search = '') => {
  const queryBuilder = db('customers');
  if (search && search.trim() !== '') {
    queryBuilder.where(function() {
      this.where('name', 'ilike', `%${search}%`)
        .orWhere('email', 'ilike', `%${search}%`)
        .orWhere('phone', 'ilike', `%${search}%`);
    });
  }
  const rows = await queryBuilder.select('*').orderBy('id', 'desc');
  return { rows };
};

/**
 * Fetch a customer by ID.
 */
export const getCustomerById = async (id) => {
  const rows = await db('customers').where({ id }).select('*').limit(1);
  return { rows };
};

/**
 * Create a new customer record.
 */
export const createCustomer = async ({ name, email, phone, address }) => {
  const rows = await db('customers')
    .insert({
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      loyalty_points: 0,
    })
    .returning('*');
  return { rows };
};

/**
 * Update an existing customer record.
 */
export const updateCustomer = async (id, fields) => {
  const allowed = ['name', 'email', 'phone', 'address'];
  const updateFields = {};
  for (const col of allowed) {
    if (fields[col] !== undefined) {
      updateFields[col] = fields[col];
    }
  }
  updateFields.updated_at = db.fn.now();

  const rows = await db('customers')
    .where({ id })
    .update(updateFields)
    .returning('*');
  return { rows };
};

/**
 * Hard-delete a customer record.
 */
export const deleteCustomer = async (id) => {
  const rows = await db('customers').where({ id }).del().returning('id');
  return { rows };
};

/**
 * Increment or decrement a customer's loyalty points balance.
 */
export const updateCustomerLoyaltyPoints = async (id, pointsDiff) => {
  const rows = await db('customers')
    .where({ id })
    .increment('loyalty_points', pointsDiff)
    .returning('*');
  return { rows };
};
