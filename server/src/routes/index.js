/**
 * routes/index.js — master API router
 *
 * This file mounts every feature router onto /api/v1.
 * It should NOT need to be edited again — to add a feature,
 * replace the `stub('Name')` router with an import of the real router.
 *
 * All placeholder routes return:
 *   501 Not Implemented
 *   { error: { message: '<Feature> API not yet implemented', code: 'NOT_IMPLEMENTED' } }
 */

import { Router } from 'express';
import authRouter from './auth.routes.js';
import kdsRouter from './kds.routes.js';
import couponsRouter from './coupons.routes.js';
import promotionsRouter from './promotions.routes.js';
import customersRouter from './customers.routes.js';
import cooksRouter from './cooks.routes.js';
import categoriesRouter from './categories.routes.js';
import productsRouter from './products.routes.js';

const router = Router();

// ─── Utility: 501 stub ───────────────────────────────────────────────────────

const stub = (name) => {
  const r = Router();
  r.all('*', (_req, res) =>
    res.status(501).json({
      error: {
        message: `${name} API not yet implemented`,
        code:    'NOT_IMPLEMENTED',
      },
    })
  );
  return r;
};

// ─── Live routes ─────────────────────────────────────────────────────────────

router.use('/auth',       authRouter);

// ─── Feature stubs — replace stub() with real router as each module is built ──

router.use('/products',   productsRouter);
router.use('/categories', categoriesRouter);
router.use('/floors',     stub('Floors'));
router.use('/tables',     stub('Tables'));
router.use('/orders',     stub('Orders'));
router.use('/customers',  customersRouter);
router.use('/sessions',   stub('Sessions'));
router.use('/coupons',    couponsRouter);
router.use('/promotions', promotionsRouter);
router.use('/employees',  stub('Employees'));
router.use('/cooks',      cooksRouter);
router.use('/kds',        kdsRouter);
router.use('/reports',    stub('Reports'));
router.use('/settings',   stub('Settings'));

export default router;
