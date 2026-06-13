const { z } = require('zod');

// Reusable date coercion — accepts ISO strings and converts to Date
const dateField = z.coerce.date({ invalid_type_error: 'Must be a valid date' });

const createTripSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Trip name must be at least 2 characters' })
      .max(100, { message: 'Trip name must be at most 100 characters' }),

    description: z.string().optional(),

    startDate: dateField.optional(),

    endDate: dateField.optional(),

    totalBudget: z
      .number({ invalid_type_error: 'Budget must be a number' })
      .positive({ message: 'Budget must be a positive number' })
      .optional(),
  })
  .refine(
    (data) => {
      // Only validate the relationship when both dates are present
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    { message: 'End date must be on or after start date', path: ['endDate'] }
  );

// All same fields but every one optional for PATCH-style updates
const updateTripSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Trip name must be at least 2 characters' })
      .max(100, { message: 'Trip name must be at most 100 characters' })
      .optional(),

    description: z.string().optional(),

    coverPhotoUrl: z.string().url({ message: 'Must be a valid URL' }).optional(),

    startDate: dateField.optional(),

    endDate: dateField.optional(),

    totalBudget: z
      .number({ invalid_type_error: 'Budget must be a number' })
      .positive({ message: 'Budget must be a positive number' })
      .optional(),

    status: z
      .enum(['PLANNING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    { message: 'End date must be on or after start date', path: ['endDate'] }
  );

module.exports = { createTripSchema, updateTripSchema };
