const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || 'Request failed';
    throw new Error(errorMessage);
  }

  return payload;
};

export const request = async (path, options = {}) => {
  const { body, headers, ...rest } = options;

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest
  });

  return parseResponse(response);
};

export { API_BASE_URL };