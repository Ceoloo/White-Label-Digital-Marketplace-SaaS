import type { Coupon, Order, Product, User } from "@/config/types";

/**
 * Minimal Airtable REST adapter.
 *
 * This intentionally uses `fetch` against the Airtable API rather than the
 * official SDK to keep the dependency surface small for the MVP. It maps
 * Airtable records into the app's domain types. Field names follow the schema
 * documented in the project scope; adjust the mappers if your base differs.
 *
 * The adapter is only used when `isAirtableConfigured()` returns true.
 */

const API_BASE = "https://api.airtable.com/v0";

export function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
}

function tableName(envKey: string, fallback: string): string {
  return process.env[envKey] || fallback;
}

interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

async function airtableFetch<T>(
  table: string,
  params: Record<string, string> = {},
): Promise<AirtableRecord<T>[]> {
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const url = new URL(`${API_BASE}/${baseId}/${encodeURIComponent(table)}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
    // Airtable data changes operationally; keep it fresh.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Airtable ${table} request failed: ${res.status}`);
  }
  const json = (await res.json()) as { records: AirtableRecord<T>[] };
  return json.records;
}

// --- Field mappers -----------------------------------------------------------

function toProduct(rec: AirtableRecord<Record<string, unknown>>): Product {
  const f = rec.fields;
  const name = String(f["Product Name"] ?? "Untitled");
  return {
    id: rec.id,
    slug: String(f["Slug"] ?? name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    name,
    description: String(f["Description"] ?? ""),
    features: asStringArray(f["Features"]),
    requirements: asStringArray(f["Requirements"]),
    price: Number(f["Price"] ?? 0),
    salePrice: f["Sale Price"] != null ? Number(f["Sale Price"]) : undefined,
    images: asStringArray(f["Images"]),
    videoUrl: f["Videos"] ? String(f["Videos"]) : undefined,
    category: String(f["Category"] ?? "Uncategorized"),
    downloadUrl: f["Download URL"] ? String(f["Download URL"]) : undefined,
    visibility: (String(f["Visibility"] ?? "public").toLowerCase() as Product["visibility"]),
    inventory: f["Inventory"] != null ? Number(f["Inventory"]) : -1,
    rating: Number(f["Rating"] ?? 0),
    reviewCount: Number(f["Review Count"] ?? 0),
    createdAt: rec.createdTime,
    // Airtable base treats all rows as digital products by default; manage
    // AI-service configs through the app's in-memory layer for the MVP.
    type: "digital",
  };
}

function toCoupon(rec: AirtableRecord<Record<string, unknown>>): Coupon {
  const f = rec.fields;
  const raw = String(f["Discount"] ?? "0");
  const isPercent = raw.includes("%");
  return {
    code: String(f["Promo Code"] ?? "").toUpperCase(),
    type: isPercent ? "percent" : "fixed",
    value: Number(raw.replace(/[^0-9.]/g, "")) || 0,
    expiresAt: f["Expiration"] ? String(f["Expiration"]) : undefined,
    usageLimit: f["Usage Limit"] != null ? Number(f["Usage Limit"]) : undefined,
    usedCount: Number(f["Used Count"] ?? 0),
    active: Boolean(f["Active"]),
  };
}

function toUser(rec: AirtableRecord<Record<string, unknown>>): User {
  const f = rec.fields;
  return {
    id: rec.id,
    name: String(f["Name"] ?? ""),
    email: String(f["Email"] ?? ""),
    phone: f["Phone"] ? String(f["Phone"]) : undefined,
    membership: (String(f["Membership"] ?? "Bronze") as User["membership"]),
    rewardPoints: Number(f["Reward Points"] ?? 0),
    referralCode: String(f["Referral Code"] ?? ""),
    lifetimeSpend: Number(f["Lifetime Spend"] ?? 0),
    status: (String(f["Status"] ?? "active").toLowerCase() as User["status"]),
  };
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) =>
      typeof v === "object" && v && "url" in v ? String((v as { url: string }).url) : String(v),
    );
  }
  if (typeof value === "string" && value.trim()) {
    return value.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

// --- Public read helpers -----------------------------------------------------

export async function fetchProducts(): Promise<Product[]> {
  const recs = await airtableFetch<Record<string, unknown>>(
    tableName("AIRTABLE_TABLE_PRODUCTS", "Products"),
  );
  return recs.map(toProduct);
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const recs = await airtableFetch<Record<string, unknown>>(
    tableName("AIRTABLE_TABLE_COUPONS", "Coupons"),
  );
  return recs.map(toCoupon);
}

export async function fetchUsers(): Promise<User[]> {
  const recs = await airtableFetch<Record<string, unknown>>(
    tableName("AIRTABLE_TABLE_USERS", "Users"),
  );
  return recs.map(toUser);
}

// --- Product writes ----------------------------------------------------------

/** Map a domain Product to Airtable fields (reverse of `toProduct`). */
function productFields(product: Product): Record<string, unknown> {
  return {
    "Product Name": product.name,
    Slug: product.slug,
    Description: product.description,
    Features: product.features.join("\n"),
    Requirements: product.requirements.join("\n"),
    Price: product.price,
    "Sale Price": product.salePrice ?? null,
    Category: product.category,
    "Download URL": product.downloadUrl ?? "",
    Visibility: product.visibility,
    Inventory: product.inventory,
  };
}

function productsUrl(): string {
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const table = tableName("AIRTABLE_TABLE_PRODUCTS", "Products");
  return `${API_BASE}/${baseId}/${encodeURIComponent(table)}`;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Create a product record; returns the mapped Product (with Airtable id). */
export async function createProduct(product: Product): Promise<Product> {
  const res = await fetch(productsUrl(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ fields: productFields(product) }),
  });
  if (!res.ok) throw new Error(`Airtable create product failed: ${res.status}`);
  const rec = (await res.json()) as { id: string };
  return { ...product, id: rec.id };
}

/** Update an existing product record by Airtable id. */
export async function updateProduct(id: string, product: Product): Promise<boolean> {
  const res = await fetch(`${productsUrl()}/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ fields: productFields(product) }),
  });
  return res.ok;
}

/** Delete a product record by Airtable id. */
export async function deleteProduct(id: string): Promise<boolean> {
  const res = await fetch(`${productsUrl()}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
  });
  return res.ok;
}

/**
 * Create an order record. Returns true when written. Writing is best-effort in
 * the MVP — the app always keeps the order in its own response regardless.
 */
export async function createOrder(order: Order): Promise<boolean> {
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const table = tableName("AIRTABLE_TABLE_ORDERS", "Orders");
  const url = `${API_BASE}/${baseId}/${encodeURIComponent(table)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        "Order ID": order.id,
        Customer: order.customerEmail,
        Total: order.total,
        "Payment Method": order.paymentMethod,
        "Delivery Status": order.deliveryStatus,
        "Refund Status": order.refundStatus,
      },
    }),
  });
  return res.ok;
}
