const express = require('express');
const communityController = require('../controllers/community.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createPostSchema, createCommentSchema } = require('../schemas/community.schema');

const router = express.Router();

router.use(authMiddleware);

router.get('/', communityController.getPosts);
router.post('/', validate(createPostSchema), communityController.createPost);
router.post('/:id/like', communityController.likePost);
router.post('/:id/comments', validate(createCommentSchema), communityController.addComment);

module.exports = router;
