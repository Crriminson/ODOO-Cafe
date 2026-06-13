const router = require('express').Router();
const { login, logout, me, signup } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/logout', logout);

module.exports = router;
