import api from './client.js';

export async function login({ email, password }) {
  const data = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', data.token);
  return data; // { token, user }
}

export async function signup({ name, email, password, role }) {
  const data = await api.post('/auth/signup', { name, email, password, role });
  localStorage.setItem('token', data.token);
  return data; // { token, user }
}

export async function logout() {
  const data = await api.post('/auth/logout');
  localStorage.removeItem('token');
  return data; // { message }
}

export async function me() {
  return api.get('/auth/me'); // { user }
}