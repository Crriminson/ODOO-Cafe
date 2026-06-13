const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { updateUserSchema } = require('../schemas/user.schema');

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

router.get('/me', userController.getMe);
router.put('/me', validate(updateUserSchema), userController.updateMe);
router.delete('/me', userController.deleteMe);

module.exports = router;
