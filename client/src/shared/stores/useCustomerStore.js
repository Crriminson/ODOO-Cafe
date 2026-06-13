import { useSyncExternalStore } from 'react';

/**
 * Shared POS customer-selection state — P4 Customers page writes here,
 * P3 Order View reads here at payment to link a customer to the order.
 *
 * Intentionally NOT named useCartStore to avoid collision with P3's Zustand
 * cart store (client/src/shared/stores/useCartStore.js) which manages
 * currentOrder / items / tableId.
 *
 * Do NOT persist selectedCustomer via localStorage — P3 consumes this store
 * at payment via the in-memory module singleton.
 */
let state = {
  selectedCustomer: null,
};

const listeners = new Set();

const notify = () => {
  for (const listener of listeners) listener();
};

export const customerStore = {
  getState: () => state,

  setSelectedCustomer: (customer) => {
    state = { ...state, selectedCustomer: customer };
    notify();
  },

  clearSelectedCustomer: () => {
    state = { ...state, selectedCustomer: null };
    notify();
  },

  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useCustomerStore = (selector = (s) => s) =>
  useSyncExternalStore(customerStore.subscribe, () => selector(customerStore.getState()));
