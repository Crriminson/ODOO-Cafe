import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth.api.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { ROLES } from '../constants/index.js';

export function useAuth() {
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  const login = (email, password) =>
    authApi.login({ email, password }).then(({ user }) => {
      setUser(user);
    });

  const signup = (name, email, password, role = ROLES.EMPLOYEE) =>
    authApi.signup({ name, email, password, role }).then(({ user }) => {
      setUser(user);
    });

  const logout = () =>
    authApi.logout().then(() => {
      clearUser();
      navigate('/login');
    });

  return { user, role, isLoading, login, signup, logout };
}