const { z } = require('zod');

const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be at most 100 characters' })
    .optional(),

  languagePref: z
    .string()
    .min(1, { message: 'Language preference cannot be empty' })
    .optional(),
});

module.exports = { updateUserSchema };
