require('dotenv').config();
const env        = require('./config/env');   // Validate env vars first — crash fast if broken
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit     = require('express-rate-limit');
const cookieParser  = require('cookie-parser');
const apiResponse = require('./utils/apiResponse');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS: only allow the configured frontend origin ───────────────────────────
app.use(cors({
  origin:      env.CLIENT_URL,
  credentials: true, // needed for httpOnly refresh-token cookie
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Required to read httpOnly refresh token cookie

// ── HTTP request logging (dev only) ──────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Global rate limiter (tightened per-route for auth in auth.routes.js) ─────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: apiResponse.error('Too many requests, please slow down.'),
}));

// ── Routes ────────────────────────────────────────────────────────────────────
// Health check — no auth required, useful for uptime monitors
app.get('/api/v1/health', (req, res) => {
  res.status(200).json(apiResponse.success({ status: 'ok', uptime: process.uptime() }, 'Server is healthy'));
});

// ── Feature routers ─────────────────────────────────────────────────────────
app.use('/api/v1/auth',       require('./routes/auth.routes'));
app.use('/api/v1/users',      require('./routes/user.routes'));
app.use('/api/v1/trips',      require('./routes/trip.routes'));

app.use('/api/v1/expenses',   require('./routes/expense.routes'));
app.use('/api/v1/packing',    require('./routes/packing.routes'));
app.use('/api/v1/notes',      require('./routes/note.routes'));
app.use('/api/v1/community',  require('./routes/community.routes'));
app.use('/api/v1/admin',      require('./routes/admin.routes'));
app.use('/api/v1/search',     require('./routes/search.routes'));

// TODO: mount as implemented in later phases
// app.use('/api/v1/cities',     require('./routes/cities.routes'));
// app.use('/api/v1/activities', require('./routes/activities.routes'));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json(apiResponse.error(`Route ${req.method} ${req.originalUrl} not found`));
});

const errorHandler = require('./middleware/errorHandler');

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);



// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🚀 Traveloop server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});
