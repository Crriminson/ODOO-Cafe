import { request } from './client.js';

export const loginRequest  = (payload) => request('/auth/login',  { method: 'POST', body: payload });
export const signupRequest = (payload) => request('/auth/signup', { method: 'POST', body: payload });
export const logoutRequest = ()        => request('/auth/logout', { method: 'POST' });
export const meRequest     = ()        => request('/auth/me');