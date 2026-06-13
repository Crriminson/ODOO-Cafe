import axiosInstance from './axiosInstance';

export const getCommunityPosts = async () => {
  const res = await axiosInstance.get('/community');
  return res.data;
};

export const createCommunityPost = async (data) => {
  const res = await axiosInstance.post('/community', data);
  return res.data;
};

export const likeCommunityPost = async (id) => {
  const res = await axiosInstance.post(`/community/${id}/like`);
  return res.data;
};

export const addCommunityComment = async (id, content) => {
  const res = await axiosInstance.post(`/community/${id}/comments`, { content });
  return res.data;
};
