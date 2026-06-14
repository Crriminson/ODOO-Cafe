import { useState, useEffect } from 'react';
import { updateOrder } from '../api/orders.api.js';

// Custom lightweight state store mimicking Zustand
const listeners = new Set();
let state = {
  orderType: 'dine_in',
  tableId: null,
  items: [],           // legacy — kept for backward compat
  currentOrder: null,  // full server-returned order object
  isCartLoading: false,

  // ─── Coupon (applied in Discount popup, sent to server at pay time) ──
  couponCode:      null,  // string | null
  discountPreview: null,  // { discount_amount, discount_type, discount_value, code } | null

  // ─── Global product search (written by nav bar, read by ProductSection) ──
  searchQuery: '',
  // ─── Existing actions ────────────────────────────────────────────────
  setOrderType: (orderType) => {
    updateState({ orderType });
  },
  setTableId: (tableId) => {
    updateState({ tableId });
  },
  setTable: (tableId) => {
    updateState({ tableId });
  },
  setItems: (items) => {
    updateState({ items });
  },
  setSearchQuery: (searchQuery) => {
    updateState({ searchQuery });
  },

  // ─── New: order object ───────────────────────────────────────────────
  setCurrentOrder: (order) => {
    updateState({ currentOrder: order });
  },

  // ─── New: item mutations (all call syncCart internally) ──────────────
  addItem: (product) => {
    const current = state.currentOrder;
    if (!current) return;

    const existing = (current.items || []).find(
      (i) => i.product_id === product.id
    );

    let nextItems;
    if (existing) {
      nextItems = (current.items || []).map((i) =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      nextItems = [
        ...(current.items || []),
        {
          product_id: product.id,
          name: product.name,
          unit_price: product.price,
          quantity: 1,
          line_total: product.price,
          tax_rate: product.tax_rate,
        },
      ];
    }

    updateState({ currentOrder: { ...current, items: nextItems } });
    _syncCart();
  },

  removeItem: (productId) => {
    const current = state.currentOrder;
    if (!current) return;

    const nextItems = (current.items || []).filter(
      (i) => i.product_id !== productId
    );
    updateState({ currentOrder: { ...current, items: nextItems } });
    _syncCart();
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      state.removeItem(productId);
      return;
    }
    const current = state.currentOrder;
    if (!current) return;

    const nextItems = (current.items || []).map((i) =>
      i.product_id === productId ? { ...i, quantity: qty } : i
    );
    updateState({ currentOrder: { ...current, items: nextItems } });
    _syncCart();
  },

  clearCart: () => {
    updateState({
      currentOrder: null,
      items: [],
      tableId: null,
      orderType: 'dine_in',
      isCartLoading: false,
      couponCode: null,
      discountPreview: null,
      searchQuery: '',
    });
  },

  /** Store a validated coupon so PaymentSection can send it at pay time */
  setCoupon: ({ code, discount_amount, discount_type, discount_value }) => {
    updateState({
      couponCode: code,
      discountPreview: { code, discount_amount, discount_type, discount_value },
    });
  },

  /** Remove the applied coupon */
  clearCoupon: () => {
    updateState({ couponCode: null, discountPreview: null });
  },
};

// ─── Internal: sync local optimistic state with the server ─────────────────
// Not exported — called automatically after every mutation.
let _syncDebounceTimer = null;

const _syncCart = () => {
  // Debounce rapid sequential taps (e.g. quickly pressing + 3 times)
  clearTimeout(_syncDebounceTimer);
  _syncDebounceTimer = setTimeout(async () => {
    const current = state.currentOrder;
    if (!current || !current.id) return;

    // Only sync draft orders — sent/paid orders are immutable
    if (current.status && current.status !== 'draft') return;

    const mappedItems = (current.items || []).map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
    }));

    updateState({ isCartLoading: true });
    try {
      const response = await updateOrder(current.id, { items: mappedItems });
      // response is already unwrapped by apiClient interceptor → { order: {...} }
      updateState({ currentOrder: response.order, isCartLoading: false });
    } catch (err) {
      console.error('[useCartStore] syncCart failed:', err.message);
      updateState({ isCartLoading: false });
    }
  }, 300);
};

// ─── Core reactive machinery ──────────────────────────────────────────────
const updateState = (nextState) => {
  state = { ...state, ...nextState };
  listeners.forEach((listener) => listener(state));
};

export const useCartStore = (selector) => {
  const [slice, setSlice] = useState(() =>
    selector ? selector(state) : state
  );

  useEffect(() => {
    const listener = (nextState) => {
      const nextSlice = selector ? selector(nextState) : nextState;
      setSlice((prevSlice) => {
        if (prevSlice === nextSlice) return prevSlice;
        if (
          typeof prevSlice === 'object' &&
          typeof nextSlice === 'object' &&
          prevSlice &&
          nextSlice
        ) {
          const keys1 = Object.keys(prevSlice);
          const keys2 = Object.keys(nextSlice);
          if (
            keys1.length === keys2.length &&
            keys1.every((key) => prevSlice[key] === nextSlice[key])
          ) {
            return prevSlice;
          }
        }
        return nextSlice;
      });
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [selector]);

  return slice;
};

export default useCartStore;
