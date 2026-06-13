import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  isLoading: true,
  setUser: (user) => set({ user, role: user?.role ?? null }),
  clearUser: () => set({ user: null, role: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
