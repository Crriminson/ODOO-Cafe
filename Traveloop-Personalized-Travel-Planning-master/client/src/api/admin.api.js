import axiosInstance from './axiosInstance';

export const getAdminAnalytics = async () => {
  const res = await axiosInstance.get('/admin/analytics');
  return res.data;
};
