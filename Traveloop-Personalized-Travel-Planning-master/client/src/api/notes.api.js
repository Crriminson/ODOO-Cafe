import axiosInstance from './axiosInstance';

export const getNotes = async (tripId) => {
  const res = await axiosInstance.get(`/notes/trip/${tripId}`);
  return res.data;
};

export const createNote = async (data) => {
  const res = await axiosInstance.post('/notes', data);
  return res.data;
};

export const updateNote = async (id, data) => {
  const res = await axiosInstance.put(`/notes/${id}`, data);
  return res.data;
};

export const deleteNote = async (id) => {
  const res = await axiosInstance.delete(`/notes/${id}`);
  return res.data;
};
