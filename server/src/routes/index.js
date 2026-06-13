const router = require('express').Router();
const authRoutes = require('./auth.routes');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);

router.get('/admin', authenticate, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin dashboard access granted', user: req.user });
});

router.get('/pos', authenticate, requireRole('employee'), (req, res) => {
  res.json({ message: 'POS terminal access granted', user: req.user });
});

router.get('/sessions', authenticate, (req, res) => {
  res.json({ message: 'Authenticated session access granted', user: req.user });
});

router.get('/kds', (req, res) => {
  res.json({ message: 'KDS is open by design' });
});

module.exports = router;
