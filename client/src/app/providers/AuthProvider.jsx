import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ROLES } from '@/shared/constants';
import { loginApi, signupApi, logoutApi, getMeApi } from '@/shared/api/auth.api';

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }
      try {
        const data = await getMeApi();
        if (mounted) setUser(data.user ?? null);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginApi({ email, password });
    const { token, user: loggedUser } = data;
    if (token) localStorage.setItem('token', token);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await signupApi({ name, email, password, role: ROLES.EMPLOYEE });
    const { token, user: newUser } = data;
    if (token) localStorage.setItem('token', token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
import { createContext, useEffect, useState } from 'react';
import { loginRequest, logoutRequest, meRequest, signupRequest } from '../../shared/api/auth.api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	const loadSession = async () => {
		try {
			const response = await meRequest();
			setUser(response.user ?? null);
		} catch {
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadSession();
	}, []);

	const login = async (credentials) => {
		const response = await loginRequest(credentials);
		setUser(response.user ?? null);
		return response.user;
	};

	const signup = async (credentials) => {
		const response = await signupRequest(credentials);
		return response.user ?? null;
	};

	const logout = async () => {
		await logoutRequest();
		setUser(null);
	};

	const value = {
		user,
		loading,
		isAuthenticated: Boolean(user),
		login,
		signup,
		logout,
		refreshUser: loadSession
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
