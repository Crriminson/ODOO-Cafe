const communityService = require('../services/community.service');
const apiResponse = require('../utils/apiResponse');

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await communityService.getPosts();
    res.status(200).json(apiResponse.success(posts));
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const post = await communityService.createPost(req.user.id, req.body);
    res.status(201).json(apiResponse.success(post, 'Post created'));
  } catch (err) {
    next(err);
  }
};

exports.likePost = async (req, res, next) => {
  try {
    const post = await communityService.likePost(req.params.id);
    res.status(200).json(apiResponse.success(post, 'Post liked'));
  } catch (err) {
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const comment = await communityService.addComment(req.params.id, req.user.id, req.body.content);
    res.status(201).json(apiResponse.success(comment, 'Comment added'));
  } catch (err) {
    next(err);
  }
};
