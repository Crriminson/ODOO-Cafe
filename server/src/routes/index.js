import { Router } from 'express';
import authRouter from './auth.routes.js';
import productsRouter from './products.routes.js';
import categoriesRouter from './categories.routes.js';
import floorsRouter from './floors.routes.js';
import tablesRouter from './tables.routes.js';
import ordersRouter from './orders.routes.js';
import sessionsRouter from './sessions.routes.js';
import settingsRouter from './settings.routes.js';
import customersRouter from './customers.routes.js';
import couponsRouter from './coupons.routes.js';
import promotionsRouter from './promotions.routes.js';
import cooksRouter from './cooks.routes.js';
import kdsRouter from './kds.routes.js';
import reportsRouter from './reports.routes.js';
import paymentsRouter from './payments.routes.js';

const router = Router();

const stub = (name) => {
  const r = Router();
  r.all('*', (_req, res) =>
    res.status(501).json({
      error: { message: `${name} API not yet implemented`, code: 'NOT_IMPLEMENTED' },
    })
  );
  return r;
};

router.use('/auth', authRouter);
router.use('/products', productsRouter);
router.use('/categories', categoriesRouter);
router.use('/floors', floorsRouter);
router.use('/tables', tablesRouter);
router.use('/orders', ordersRouter);
router.use('/sessions', sessionsRouter);
router.use('/settings', settingsRouter);
router.use('/customers', customersRouter);
router.use('/coupons', couponsRouter);
router.use('/promotions', promotionsRouter);
router.use('/cooks', cooksRouter);
router.use('/kds', kdsRouter);
router.use('/employees', stub('Employees'));
router.use('/reports', reportsRouter);
router.use('/payments/razorpay', paymentsRouter);

export default router;
