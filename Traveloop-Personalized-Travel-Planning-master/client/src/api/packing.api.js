import axiosInstance from './axiosInstance';

export const getPackingItems = async (tripId) => {
  const res = await axiosInstance.get(`/packing/trip/${tripId}`);
  return res.data;
};

export const createPackingItem = async (data) => {
  const res = await axiosInstance.post('/packing', data);
  return res.data;
};

export const updatePackingItem = async (id, data) => {
  const res = await axiosInstance.put(`/packing/${id}`, data);
  return res.data;
};

export const deletePackingItem = async (id) => {
  const res = await axiosInstance.delete(`/packing/${id}`);
  return res.data;
};
