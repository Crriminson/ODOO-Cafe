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
import authRouter       from './auth.routes.js';
import categoriesRouter from './categories.routes.js';
import productsRouter   from './products.routes.js';
import floorsRouter     from './floors.routes.js';
import tablesRouter     from './tables.routes.js';
import settingsRouter   from './settings.routes.js';

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
router.use('/floors',     floorsRouter);
router.use('/tables',     tablesRouter);
router.use('/orders',     (await import('./orders.routes.js')).default);
router.use('/customers',  stub('Customers'));
router.use('/sessions',   (await import('./sessions.routes.js')).default);
router.use('/coupons',    stub('Coupons'));
router.use('/promotions', stub('Promotions'));
router.use('/employees',  stub('Employees'));
router.use('/cooks',      stub('Cooks'));
router.use('/kds',        stub('KDS'));
router.use('/reports',    stub('Reports'));
router.use('/settings',   settingsRouter);

export default router;
