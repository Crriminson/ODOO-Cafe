import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setUser: (user) => set({ user }),
      setToken: (accessToken) => set({ accessToken }),
      setAuth: (user, accessToken) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'traveloop-auth',
      // Only persist accessToken and user info
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken 
      }),
    }
  )
);
