import { create } from 'zustand';

export const useTripStore = create((set) => ({
  currentTrip: null,
  trips: [],

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setTrips: (trips) => set({ trips }),
  clearTrips: () => set({ trips: [], currentTrip: null }),
}));
