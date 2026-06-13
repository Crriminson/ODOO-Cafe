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
