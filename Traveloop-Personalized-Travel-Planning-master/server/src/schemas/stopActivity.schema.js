const { z } = require('zod');

// "HH:MM" — 00:00 through 23:59
const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Time must be in HH:MM format (00:00–23:59)' });

const createStopActivitySchema = z
  .object({
    activityId: z
      .string()
      .uuid({ message: 'activityId must be a valid UUID' })
      .nullable()
      .optional(),

    customName: z
      .string()
      .min(1, { message: 'customName cannot be empty' })
      .optional(),

    startTime: timeField.nullable().optional(),

    endTime: timeField.nullable().optional(),

    cost: z
      .number({ invalid_type_error: 'cost must be a number' })
      .nonnegative({ message: 'cost must be 0 or greater' })
      .default(0),

    notes: z
      .string()
      .max(500, { message: 'Notes must be at most 500 characters' })
      .nullable()
      .optional(),

    location: z
      .string()
      .max(255, { message: 'Location must be at most 255 characters' })
      .nullable()
      .optional(),

    orderIndex: z
      .number({ invalid_type_error: 'orderIndex must be a number' })
      .int({ message: 'orderIndex must be an integer' })
      .nonnegative({ message: 'orderIndex must be 0 or greater' })
      .default(0),

    dayOffset: z
      .number({ invalid_type_error: 'dayOffset must be a number' })
      .int({ message: 'dayOffset must be an integer' })
      .nonnegative({ message: 'dayOffset must be 0 or greater' })
      .default(0),
  })
  .refine(
    // If no catalog activity is linked, a custom name is mandatory
    (data) => {
      const hasCatalogActivity = data.activityId != null;
      const hasCustomName = typeof data.customName === 'string' && data.customName.trim().length > 0;
      return hasCatalogActivity || hasCustomName;
    },
    {
      message: 'customName is required when activityId is not provided',
      path: ['customName'],
    }
  );

// All fields optional for updates — same underlying rules
const updateStopActivitySchema = z
  .object({
    activityId: z
      .string()
      .uuid({ message: 'activityId must be a valid UUID' })
      .nullable()
      .optional(),

    customName: z
      .string()
      .min(1, { message: 'customName cannot be empty' })
      .optional(),

    startTime: timeField.nullable().optional(),

    endTime: timeField.nullable().optional(),

    cost: z
      .number({ invalid_type_error: 'cost must be a number' })
      .nonnegative({ message: 'cost must be 0 or greater' })
      .optional(),

    notes: z
      .string()
      .max(500, { message: 'Notes must be at most 500 characters' })
      .nullable()
      .optional(),

    location: z
      .string()
      .max(255, { message: 'Location must be at most 255 characters' })
      .nullable()
      .optional(),

    orderIndex: z
      .number({ invalid_type_error: 'orderIndex must be a number' })
      .int({ message: 'orderIndex must be an integer' })
      .nonnegative({ message: 'orderIndex must be 0 or greater' })
      .optional(),

    dayOffset: z
      .number({ invalid_type_error: 'dayOffset must be a number' })
      .int({ message: 'dayOffset must be an integer' })
      .nonnegative({ message: 'dayOffset must be 0 or greater' })
      .optional(),

    isLocked: z.boolean().optional(),
  })
  .refine(
    // Only enforce the rule when activityId is being explicitly set to null
    (data) => {
      if (data.activityId === null) {
        return typeof data.customName === 'string' && data.customName.trim().length > 0;
      }
      return true;
    },
    {
      message: 'customName is required when activityId is set to null',
      path: ['customName'],
    }
  );

const reorderStopActivitiesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid({ message: 'Each activity id must be a valid UUID' }),
        orderIndex: z
          .number({ invalid_type_error: 'orderIndex must be a number' })
          .int({ message: 'orderIndex must be an integer' })
          .nonnegative({ message: 'orderIndex must be 0 or greater' }),
      })
    )
    .min(1, { message: 'items array must contain at least one entry' }),
});

module.exports = {
  createStopActivitySchema,
  updateStopActivitySchema,
  reorderStopActivitiesSchema,
};
