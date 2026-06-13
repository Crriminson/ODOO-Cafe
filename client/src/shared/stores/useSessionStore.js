import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  currentSession: null,
  // P3 fills in: openSession(), closeSession()
}));
