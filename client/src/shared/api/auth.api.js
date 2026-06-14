import { request } from './client.js';

export const loginRequest  = (payload) => request('/auth/login',  { method: 'POST', body: payload });
export const signupRequest = (payload) => request('/auth/signup', { method: 'POST', body: payload });
export const logoutRequest = ()        => request('/auth/logout', { method: 'POST' });
export const meRequest = () => {
  // Short-circuit: no token → no session to restore, skip the network call
  // entirely so AuthProvider never logs a noisy 401 on unauthenticated loads.
  const token = localStorage.getItem('token');
  if (!token) return Promise.resolve({ user: null });
  return request('/auth/me');
};