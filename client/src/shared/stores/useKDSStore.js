import { create } from 'zustand';

export const useKDSStore = create((set) => ({
  orders: [],
}));
