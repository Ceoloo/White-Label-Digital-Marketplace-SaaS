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

// -- Products -----------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  if (useAirtable) {
    try {
      return await airtable.fetchProducts();
    } catch {
      // Fall back to demo data if the live call fails, so the store stays up.
      return mockProducts;
    }
  }
  return mockProducts;
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
  return mockOrders;
}

export async function getOrdersForEmail(email: string): Promise<Order[]> {
  const orders = await getOrders();
  return orders.filter((o) => o.customerEmail.toLowerCase() === email.toLowerCase());
}

export async function saveOrder(order: Order): Promise<void> {
  mockOrders.unshift(order);
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
