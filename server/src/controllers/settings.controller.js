import {
  getPaymentMethods  as fetchPaymentMethods,
  updatePaymentMethods as persistPaymentMethods,
} from '../db/queries/settings.queries.js';

// ─── GET /api/v1/settings/payment-methods ────────────────────────────────────

export const getPaymentMethods = async (req, res, next) => {
  try {
    const { rows } = await fetchPaymentMethods();
    return res.status(200).json({ payment_methods: rows });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/v1/settings/payment-methods ────────────────────────────────────

export const updatePaymentMethods = async (req, res, next) => {
  try {
    const methods = req.body; // array, validated by zod

    // UPI gate — must run BEFORE any DB call
    const upiItem = methods.find((m) => m.method === 'upi');
    if (
      upiItem &&
      upiItem.is_enabled === true &&
      (upiItem.upi_id === null ||
        upiItem.upi_id === undefined ||
        upiItem.upi_id.trim() === '')
    ) {
      return res.status(422).json({
        error: {
          message: 'UPI ID is required to enable UPI payments',
          code:    'VALIDATION_ERROR',
          fields:  [
            {
              field:   'upi_id',
              message: 'UPI ID is required to enable UPI payments',
            },
          ],
        },
      });
    }

    // Update sequentially and return fresh DB state
    const { rows } = await persistPaymentMethods(methods);
    return res.status(200).json({ payment_methods: rows });
  } catch (err) {
    next(err);
  }
};

// ─── App Settings (round-2 — not implemented yet) ────────────────────────────
// export const getAppSettings    = async (req, res, next) => { ... };
// export const updateAppSettings = async (req, res, next) => { ... };
