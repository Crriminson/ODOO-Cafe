import { useEffect } from 'react';
import * as authApi from '../shared/api/auth.api.js';
import { useAuthStore } from '../shared/stores/useAuthStore.js';

export default function AuthProvider({ children }) {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    authApi.me()
      .then(({ user }) => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        clearUser();
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return children;
}

export { AuthProvider };
