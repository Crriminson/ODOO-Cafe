const { z } = require('zod');

const ExpenseCategory = ['TRANSPORT', 'ACCOMMODATION', 'ACTIVITIES', 'MEALS', 'SHOPPING', 'MISCELLANEOUS'];

const createExpenseSchema = z.object({
  tripId: z.string().uuid(),
  stopId: z.string().uuid().optional(),
  category: z.enum(ExpenseCategory),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().optional(),
});

const updateExpenseSchema = z.object({
  category: z.enum(ExpenseCategory).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
});

module.exports = { createExpenseSchema, updateExpenseSchema };
