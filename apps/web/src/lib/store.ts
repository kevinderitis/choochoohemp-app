import { create } from "zustand";
import type { CartItem, CustomerProfile } from "@choochoo/shared";

type AppState = {
  ageAccepted: boolean;
  user: CustomerProfile | null;
  cart: CartItem[];
  setAgeAccepted: (value: boolean) => void;
  setUser: (user: CustomerProfile | null) => void;
  addToCart: (item: CartItem) => void;
  updateQty: (lineId: string, quantity: number) => void;
  clearCart: () => void;
};

const ageAccepted = localStorage.getItem("choochoo-age-ok") === "true";
const storedUser = localStorage.getItem("choochoo-user");

export const useAppStore = create<AppState>((set) => ({
  ageAccepted,
  user: storedUser ? (JSON.parse(storedUser) as CustomerProfile) : null,
  cart: [],
  setAgeAccepted: (value) => {
    localStorage.setItem("choochoo-age-ok", String(value));
    set({ ageAccepted: value });
  },
  setUser: (user) => {
    if (user) localStorage.setItem("choochoo-user", JSON.stringify(user));
    else localStorage.removeItem("choochoo-user");
    set({ user });
  },
  addToCart: (item) =>
    set((state) => {
      const lineId = item.lineId || item.productId;
      const existing = state.cart.find((entry) => (entry.lineId || entry.productId) === lineId);
      if (existing) {
        return {
          cart: state.cart.map((entry) =>
            (entry.lineId || entry.productId) === lineId ? { ...entry, quantity: entry.quantity + item.quantity } : entry
          )
        };
      }
      return { cart: [...state.cart, { ...item, lineId }] };
    }),
  updateQty: (lineId, quantity) =>
    set((state) => ({
      cart:
        quantity <= 0
          ? state.cart.filter((item) => (item.lineId || item.productId) !== lineId)
          : state.cart.map((item) => ((item.lineId || item.productId) === lineId ? { ...item, quantity } : item))
    })),
  clearCart: () => set({ cart: [] })
}));
