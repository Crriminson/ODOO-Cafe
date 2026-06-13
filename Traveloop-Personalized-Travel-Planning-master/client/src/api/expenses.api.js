import axiosInstance from './axiosInstance';

export const getExpenses = async (tripId) => {
  const res = await axiosInstance.get(`/expenses/trip/${tripId}`);
  return res.data;
};

export const createExpense = async (data) => {
  const res = await axiosInstance.post('/expenses', data);
  return res.data;
};

export const updateExpense = async (id, data) => {
  const res = await axiosInstance.put(`/expenses/${id}`, data);
  return res.data;
};

export const deleteExpense = async (id) => {
  const res = await axiosInstance.delete(`/expenses/${id}`);
  return res.data;
};
