const prisma = require('../config/db');
const AppError = require('../utils/AppError');

exports.getPosts = async () => {
  return prisma.communityPost.findMany({
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      comments: {
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

exports.createPost = async (authorId, data) => {
  return prisma.communityPost.create({
    data: { ...data, authorId },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } }
  });
};

exports.likePost = async (postId) => {
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found', 404);
  return prisma.communityPost.update({
    where: { id: postId },
    data: { likes: post.likes + 1 }
  });
};

exports.addComment = async (postId, authorId, content) => {
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found', 404);
  return prisma.communityComment.create({
    data: { postId, authorId, content },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } }
  });
};
