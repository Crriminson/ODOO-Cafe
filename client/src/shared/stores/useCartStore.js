import { create } from 'zustand';

export const useCartStore = create((set) => ({
  currentOrder: null,
  items: [],
  tableId: null,
}));
