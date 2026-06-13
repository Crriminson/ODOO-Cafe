const { z } = require('zod');

const PackingCategory = ['CLOTHING', 'DOCUMENTS', 'ELECTRONICS', 'TOILETRIES', 'MEDICATIONS', 'MISCELLANEOUS'];

const createPackingSchema = z.object({
  tripId: z.string().uuid(),
  name: z.string().min(1).max(255),
  category: z.enum(PackingCategory).optional(),
});

const updatePackingSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.enum(PackingCategory).optional(),
  isPacked: z.boolean().optional(),
});

module.exports = { createPackingSchema, updatePackingSchema };
