import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  findValidCouponByCode,
} from '../db/queries/coupons.queries.js';
import { createCouponSchema } from '../utils/validators.js';

// GET /api/v1/coupons
export const getCoupons = async (req, res, next) => {
  try {
    const { rows } = await getAllCoupons();
    const coupons = rows.map((r) => ({
      ...r,
      discount_value: Number(r.discount_value).toFixed(2),
    }));
    res.json({ coupons });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/coupons
export const create = async (req, res, next) => {
  try {
    const { code, discount_type, discount_value } = req.body;

    const { rows } = await createCoupon(code, discount_type, discount_value);
    const coupon = rows[0];
    coupon.discount_value = Number(coupon.discount_value).toFixed(2);

    res.status(201).json({ coupon });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: { message: 'Coupon code already exists', code: 'CODE_EXISTS' },
      });
    }
    next(err);
  }
};

// PUT /api/v1/coupons/:id
export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await getCouponById(id);
    if (!existing) {
      return res.status(404).json({
        error: { message: 'Coupon not found', code: 'NOT_FOUND' },
      });
    }

    const merged = {
      code: req.body.code !== undefined ? req.body.code : existing.code,
      discount_type:
        req.body.discount_type !== undefined ? req.body.discount_type : existing.discount_type,
      discount_value:
        req.body.discount_value !== undefined
          ? req.body.discount_value
          : parseFloat(existing.discount_value),
    };

    const validationResult = createCouponSchema.safeParse(merged);
    if (!validationResult.success) {
      const fields = validationResult.error.errors.map((e) => ({
        field: e.path.join('.') || 'body',
        message: e.message,
      }));
      return res.status(422).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields,
        },
      });
    }

    const updated = await updateCoupon(id, req.body);
    updated.discount_value = Number(updated.discount_value).toFixed(2);

    res.json({ coupon: updated });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: { message: 'Coupon code already exists', code: 'CODE_EXISTS' },
      });
    }
    next(err);
  }
};

// DELETE /api/v1/coupons/:id
export const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await deleteCoupon(id);
    if (rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Coupon not found', code: 'NOT_FOUND' },
      });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/coupons/validate
 * Requires auth (employee or admin). No side-effects.
 *
 * Body: { code: string, order_total: string|number }
 * Returns the coupon metadata + computed discount_amount preview.
 * Used by the POS Discount popup before payment.
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, order_total } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(422).json({
        error: { message: 'Coupon code is required', code: 'VALIDATION_ERROR' },
      });
    }

    const coupon = await findValidCouponByCode(code.trim());

    if (!coupon) {
      return res.status(404).json({
        error: { message: 'Invalid or inactive coupon code', code: 'INVALID_COUPON' },
      });
    }

    // Compute preview discount amount against the supplied order total
    const total = parseFloat(order_total || 0);
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (total * parseFloat(coupon.discount_value)) / 100;
    } else {
      // fixed
      discountAmount = Math.min(parseFloat(coupon.discount_value), total);
    }

    return res.json({
      coupon: {
        id:             coupon.id,
        code:           coupon.code,
        discount_type:  coupon.discount_type,
        discount_value: Number(coupon.discount_value).toFixed(2),
        discount_amount: discountAmount.toFixed(2),
      },
    });
  } catch (err) {
    next(err);
  }
};
