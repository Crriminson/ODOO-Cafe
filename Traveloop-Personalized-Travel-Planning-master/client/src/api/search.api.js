import axiosInstance from './axiosInstance';

export const searchEntities = async (query, type) => {
  const res = await axiosInstance.get('/search', { params: { q: query, type } });
  return res.data;
};

export const getTopDestinations = async () => {
  const res = await axiosInstance.get('/search/top-destinations');
  return res.data;
};

export const getCityActivities = async (cityId, category) => {
  const res = await axiosInstance.get('/search/city-activities', {
    params: { cityId, ...(category && { category }) },
  });
  return res.data;
};
