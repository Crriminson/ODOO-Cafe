import express from 'express';
import cors    from 'cors';
import { env }          from './config/env.js';
import { query }        from './config/db.js';
import apiRouter        from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Allow any localhost port in dev (Vite may pick 5174, 5175 …)
    if (!origin || env.NODE_ENV === 'development') return cb(null, true);
    cb(origin === env.CLIENT_URL ? null : new Error('CORS'), origin === env.CLIENT_URL);
  },
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/v1/health', async (_req, res) => {
  let dbOk = false;
  try {
    await query('SELECT 1');
    dbOk = true;
  } catch {
    // swallow — db status is just reported, not thrown
  }
  res.json({ status: 'ok', db: dbOk });
});

// ─── Feature routes ───────────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Route not found', code: 'NOT_FOUND' } });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
