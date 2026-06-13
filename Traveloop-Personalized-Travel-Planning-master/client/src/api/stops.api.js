import axiosInstance from './axiosInstance';

export const getStops = async (tripId) => {
  const res = await axiosInstance.get(`/trips/${tripId}/stops`);
  return res.data;
};

export const createStop = async (tripId, data) => {
  const res = await axiosInstance.post(`/trips/${tripId}/stops`, data);
  return res.data;
};

export const updateStop = async (tripId, stopId, data) => {
  const res = await axiosInstance.put(`/trips/${tripId}/stops/${stopId}`, data);
  return res.data;
};

export const deleteStop = async (tripId, stopId) => {
  const res = await axiosInstance.delete(`/trips/${tripId}/stops/${stopId}`);
  return res.data;
};

export const reorderStops = async (tripId, items) => {
  const res = await axiosInstance.patch(`/trips/${tripId}/stops/reorder`, { items });
  return res.data;
};
