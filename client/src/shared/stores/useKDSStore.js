import { create } from 'zustand';

export const useKDSStore = create((set) => ({
  orders: [],
  // P4 fills in: addOrder(), updateStage(), completeItem(), removeOrder()
}));
