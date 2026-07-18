"use client";

import * as React from "react";
import { effectivePrice } from "@/lib/utils";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartLine, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);
const STORAGE_KEY = "wl_marketplace_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // Load persisted cart on mount.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration to avoid clobbering stored state).
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be unavailable */
    }
  }, [lines, hydrated]);

  const add = React.useCallback(
    (item: Omit<CartLine, "quantity">, qty = 1) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === item.productId);
        if (existing) {
          return prev.map((l) =>
            l.productId === item.productId
              ? { ...l, quantity: l.quantity + qty }
              : l,
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });
    },
    [],
  );

  const remove = React.useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const setQuantity = React.useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) =>
            l.productId === productId ? { ...l, quantity: qty } : l,
          ),
    );
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const value: CartContextValue = {
    lines,
    count,
    subtotal,
    add,
    remove,
    setQuantity,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

/** Helper to build a cart line from a product-like object. */
export function toCartLine(p: {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice?: number;
}): Omit<CartLine, "quantity"> {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    price: effectivePrice(p.price, p.salePrice),
  };
}
