import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or fewer'),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(150, 'Email must be 150 characters or fewer'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),

  role: z.enum(['admin', 'employee'], {
    errorMap: () => ({ message: "Role must be 'admin' or 'employee'" }),
  }),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ─── Add feature schemas below as modules are implemented ────────────────────
// export const createProductSchema = z.object({ ... });

const baseCouponSchema = z.object({
  code: z
    .string({ required_error: 'Coupon code is required' })
    .min(1, 'Coupon code cannot be empty')
    .max(50, 'Coupon code must be 50 characters or fewer'),
  discount_type: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: "Discount type must be 'percentage' or 'fixed'" }),
  }),
  discount_value: z
    .number({ required_error: 'Discount value is required' })
    .positive('Discount value must be positive'),
});

export const createCouponSchema = baseCouponSchema.superRefine((data, ctx) => {
  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage discount cannot exceed 100%',
      path: ['discount_value'],
    });
  }
});

export const updateCouponSchema = baseCouponSchema.partial().superRefine((data, ctx) => {
  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage discount cannot exceed 100%',
      path: ['discount_value'],
    });
  }
});

const basePromotionSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty'),
  applies_to: z.enum(['product', 'order'], {
    errorMap: () => ({ message: "Applies to must be 'product' or 'order'" }),
  }),
  product_id: z.number().int().positive().nullable().optional(),
  min_quantity: z.number().int().positive().nullable().optional(),
  min_order_amount: z.number().positive().nullable().optional(),
  discount_type: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: "Discount type must be 'percentage' or 'fixed'" }),
  }),
  discount_value: z
    .number({ required_error: 'Discount value is required' })
    .positive('Discount value must be positive'),
});

export const createPromotionSchema = basePromotionSchema.superRefine((data, ctx) => {
  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage discount cannot exceed 100%',
      path: ['discount_value'],
    });
  }

  if (data.applies_to === 'product') {
    if (data.product_id === undefined || data.product_id === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Product ID is required when promotion applies to product',
        path: ['product_id'],
      });
    }
    if (data.min_quantity === undefined || data.min_quantity === null || data.min_quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum quantity must be greater than 0',
        path: ['min_quantity'],
      });
    }
  }

  if (data.applies_to === 'order') {
    if (data.min_order_amount === undefined || data.min_order_amount === null || data.min_order_amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum order amount must be greater than 0',
        path: ['min_order_amount'],
      });
    }
  }
});

export const updatePromotionSchema = basePromotionSchema.partial().superRefine((data, ctx) => {
  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage discount cannot exceed 100%',
      path: ['discount_value'],
    });
  }
});

// ─── Customers ──────────────────────────────────────────────────────────────
export const createCustomerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or fewer'),
  email: z
    .string()
    .email('Invalid email address')
    .max(150, 'Email must be 150 characters or fewer')
    .or(z.literal(''))
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(20, 'Phone must be 20 characters or fewer')
    .or(z.literal(''))
    .nullable()
    .optional(),
  address: z
    .string()
    .or(z.literal(''))
    .nullable()
    .optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ─── Cooks ───────────────────────────────────────────────────────────────────
export const createCookSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or fewer'),
  category_preferences: z
    .array(z.number().int().positive())
    .optional(),
});

export const updateCookSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or fewer')
    .optional(),
  is_active: z.boolean().optional(),
  category_preferences: z
    .array(z.number().int().positive())
    .optional(),
});
