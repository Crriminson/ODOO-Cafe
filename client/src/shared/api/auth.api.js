import client from './client';

export async function loginApi({ email, password }) {
  const res = await client.post('/auth/login', { email, password });
  return res.data;
}

export async function signupApi({ name, email, password, role }) {
  const res = await client.post('/auth/signup', { name, email, password, role });
  return res.data;
}

export async function logoutApi() {
  const res = await client.post('/auth/logout');
  return res.data;
}

export async function getMeApi() {
  const res = await client.get('/auth/me');
  return res.data;
}
import { request } from './client';

export const loginRequest = (payload) => request('/auth/login', { method: 'POST', body: payload });

export const signupRequest = (payload) => request('/auth/signup', { method: 'POST', body: payload });

export const logoutRequest = () => request('/auth/logout', { method: 'POST' });

export const meRequest = () => request('/auth/me');