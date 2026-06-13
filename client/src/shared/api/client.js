import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response.data,
  (err) => {
    const serverError = err?.response?.data?.error;
    const message = serverError?.message || err.message || 'Network error';
    const code = serverError?.code || 'NETWORK_ERROR';
    const fields = serverError?.fields || null;
    const status = err?.response?.status || 0;

    const error = new Error(message);
    error.code = code;
    error.fields = fields;
    error.status = status;

    if (status === 401) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;