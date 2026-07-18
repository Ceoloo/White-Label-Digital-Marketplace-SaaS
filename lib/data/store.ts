import type {
  Coupon,
  DeviceSession,
  Order,
  Product,
  SecurityEvent,
  User,
} from "@/config/types";
import * as airtable from "./airtable";
import {
  mockCoupons,
  mockDeviceSessions,
  mockOrders,
  mockProducts,
  mockSecurityEvents,
  mockUsers,
} from "./mock";

/**
 * Data-access facade.
 *
 * Every part of the app reads and writes through these functions. When Airtable
 * is configured, reads hit the live base; otherwise the built-in in-memory demo
 * data is used so the app runs with zero setup. This is the single seam to swap
 * the persistence layer (e.g. migrate to Postgres) later.
 */

const useAirtable = airtable.isAirtableConfigured();

/**
 * The mutable demo state (products + orders) is stashed on `globalThis` so every
 * module instance shares ONE copy. Next can load this module separately in the
 * React Server Components layer and the route-handler layer; without this, a
 * product created via an API route would be invisible to server-rendered pages.
 * Seeded once from the demo data; resets when the process restarts.
 */
interface MutableState {
  products: Product[];
  orders: Order[];
}
const globalForStore = globalThis as unknown as { __wlStore?: MutableState };
const state: MutableState =
  globalForStore.__wlStore ??
  (globalForStore.__wlStore = {
    products: [...mockProducts],
    orders: [...mockOrders],
  });

// -- Products -----------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  if (useAirtable) {
    try {
      return await airtable.fetchProducts();
    } catch {
      // Fall back to demo data if the live call fails, so the store stays up.
      return state.products;
    }
  }
  return state.products;
}

export async function getPublicProducts(): Promise<Product[]> {
  const all = await getProducts();
  return all.filter((p) => p.visibility === "public");
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.id === id) ?? null;
}

export async function getProductBySlugExcluding(
  slug: string,
  excludeId?: string,
): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug && p.id !== excludeId) ?? null;
}

// -- Product mutations (admin CRUD) -------------------------------------------

export async function createProduct(product: Product): Promise<Product> {
  if (useAirtable) {
    const created = await airtable.createProduct(product);
    return created;
  }
  state.products.unshift(product);
  return product;
}

export async function updateProduct(product: Product): Promise<Product> {
  if (useAirtable) {
    await airtable.updateProduct(product.id, product);
    return product;
  }
  const idx = state.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) state.products[idx] = product;
  return product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (useAirtable) {
    return airtable.deleteProduct(id);
  }
  const idx = state.products.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  state.products.splice(idx, 1);
  return true;
}

/**
 * Decrement finite inventory after a sale. Unlimited stock (-1) is untouched.
 * Best-effort against Airtable; always applied in the in-memory store.
 */
export async function decrementInventory(id: string, qty: number): Promise<void> {
  const product = await getProductById(id);
  if (!product || product.inventory < 0) return;
  const next = Math.max(0, product.inventory - Math.max(0, qty));
  const updated = { ...product, inventory: next };
  if (useAirtable) {
    try {
      await airtable.updateProduct(id, updated);
    } catch {
      /* best effort */
    }
    return;
  }
  const idx = state.products.findIndex((p) => p.id === id);
  if (idx >= 0) state.products[idx] = updated;
}

// -- Coupons ------------------------------------------------------------------

export async function getCoupons(): Promise<Coupon[]> {
  if (useAirtable) {
    try {
      return await airtable.fetchCoupons();
    } catch {
      return mockCoupons;
    }
  }
  return mockCoupons;
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const coupons = await getCoupons();
  const match = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return match ?? null;
}

// -- Users --------------------------------------------------------------------

export async function getUsers(): Promise<User[]> {
  if (useAirtable) {
    try {
      return await airtable.fetchUsers();
    } catch {
      return mockUsers;
    }
  }
  return mockUsers;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

/** The "current" demo customer used for dashboard/rewards views in the MVP. */
export async function getCurrentUser(): Promise<User | null> {
  const users = await getUsers();
  return users[0] ?? null;
}

// -- Orders -------------------------------------------------------------------

export async function getOrders(): Promise<Order[]> {
  // Orders are always tracked in-memory for the demo; when Airtable is
  // configured, new orders are additionally written through (best effort).
  return state.orders;
}

export async function getOrdersForEmail(email: string): Promise<Order[]> {
  const orders = await getOrders();
  return orders.filter((o) => o.customerEmail.toLowerCase() === email.toLowerCase());
}

export async function saveOrder(order: Order): Promise<void> {
  state.orders.unshift(order);
  if (useAirtable) {
    try {
      await airtable.createOrder(order);
    } catch {
      // Best effort — the order is still tracked in-memory for the session.
    }
  }
}

// -- Privacy / security telemetry --------------------------------------------

export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  return [...mockSecurityEvents].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export async function getSecurityEventsForEmail(
  email: string,
): Promise<SecurityEvent[]> {
  const events = await getSecurityEvents();
  return events.filter(
    (e) => e.userEmail.toLowerCase() === email.toLowerCase(),
  );
}

export async function getDeviceSessions(): Promise<DeviceSession[]> {
  return mockDeviceSessions;
}

export async function getDeviceSessionsForEmail(
  email: string,
): Promise<DeviceSession[]> {
  const devices = await getDeviceSessions();
  return devices.filter(
    (d) => d.userEmail.toLowerCase() === email.toLowerCase(),
  );
}

export function dataSource(): "airtable" | "in-memory" {
  return useAirtable ? "airtable" : "in-memory";
}
