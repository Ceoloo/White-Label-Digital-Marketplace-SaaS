import { NextResponse } from "next/server";
import type {
  Order,
  OrderItem,
  PaymentMethodId,
  ServiceRequest,
} from "@/config/types";
import marketplaceConfig from "@/config/marketplace.config";
import {
  createServiceRequest,
  decrementInventory,
  getCouponByCode,
  getProductById,
  getUserByEmail,
  saveOrder,
} from "@/lib/data/store";
import { evaluateCoupon } from "@/lib/coupons";
import { initiatePayment } from "@/lib/payments";
import { xpForSpend } from "@/lib/rewards";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  email?: string;
  name?: string;
  paymentMethod?: PaymentMethodId;
  couponCode?: string;
  items?: { productId: string; quantity: number }[];
}

/**
 * Server-authoritative checkout. Re-prices every line from the catalog (never
 * trusts client prices), re-validates the coupon, applies the first-purchase
 * promotion, records the order, and returns payment instructions + XP earned.
 */
export async function POST(req: Request) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const method = body.paymentMethod;
  const items = Array.isArray(body.items) ? body.items : [];

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const methodConfig = marketplaceConfig.payments.find(
    (p) => p.id === method && p.enabled,
  );
  if (!method || !methodConfig) {
    return NextResponse.json(
      { error: "Unsupported or disabled payment method." },
      { status: 400 },
    );
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Re-price server-side from the catalog and enforce stock.
  const orderItems: OrderItem[] = [];
  for (const line of items) {
    const product = await getProductById(line.productId);
    if (!product || product.visibility !== "public") continue;
    // inventory: -1 = unlimited; 0 = sold out (skip); N = cap the quantity.
    if (product.inventory === 0) continue;
    let qty = Math.max(1, Math.floor(Number(line.quantity) || 1));
    if (product.inventory > 0) qty = Math.min(qty, product.inventory);
    const price =
      product.salePrice && product.salePrice > 0 && product.salePrice < product.price
        ? product.salePrice
        : product.price;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price,
      quantity: qty,
    });
  }

  if (orderItems.length === 0) {
    return NextResponse.json(
      { error: "None of the cart items are available or in stock." },
      { status: 400 },
    );
  }

  const subtotal = round2(
    orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  // Coupon.
  let discount = 0;
  let appliedCode: string | undefined;
  if (body.couponCode?.trim()) {
    const coupon = await getCouponByCode(body.couponCode.trim());
    const result = evaluateCoupon(coupon, subtotal);
    if (result.valid) {
      discount = result.discount;
      appliedCode = coupon!.code;
    }
  }

  // First-purchase promotion (auto-applied to new customers).
  const existingUser = await getUserByEmail(email);
  const isFirstPurchase = !existingUser || existingUser.lifetimeSpend === 0;
  const promoPct = marketplaceConfig.promotions.firstPurchaseDiscountPct;
  if (isFirstPurchase && promoPct > 0 && !appliedCode) {
    discount = round2((subtotal * promoPct) / 100);
  }

  const total = round2(Math.max(0, subtotal - discount));

  const order: Order = {
    id: `ord_${Date.now().toString(36)}`,
    customerEmail: email,
    customerName: name,
    items: orderItems,
    subtotal,
    discount,
    total,
    couponCode: appliedCode,
    paymentMethod: method,
    paymentStatus: "pending",
    deliveryStatus: "pending",
    refundStatus: "none",
    createdAt: new Date().toISOString(),
  };

  const { instruction, paymentStatus } = initiatePayment(order);
  order.paymentStatus = paymentStatus;
  // Instant methods deliver immediately in the MVP; manual methods wait.
  order.deliveryStatus = paymentStatus === "paid" ? "delivered" : "pending";

  await saveOrder(order);

  // Draw down finite inventory, and spin up an AI service request for each
  // purchased service unit (the buyer completes it from "My AI services").
  let serviceRequestsCreated = 0;
  for (const item of orderItems) {
    await decrementInventory(item.productId, item.quantity);
    const product = await getProductById(item.productId);
    if (product?.type === "service") {
      for (let i = 0; i < item.quantity; i++) {
        const request: ServiceRequest = {
          id: `svcreq_${Date.now().toString(36)}_${serviceRequestsCreated}`,
          serviceId: product.id,
          serviceName: product.name,
          orderId: order.id,
          customerEmail: email,
          customerName: name,
          inputs: {},
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        await createServiceRequest(request);
        serviceRequestsCreated++;
      }
    }
  }

  const xpEarned = marketplaceConfig.rewards.enabled
    ? xpForSpend(total, isFirstPurchase)
    : 0;

  return NextResponse.json({
    order: {
      id: order.id,
      subtotal,
      discount,
      total,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      couponCode: appliedCode,
      isFirstPurchase,
      serviceRequestsCreated,
    },
    instruction,
    xpEarned,
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
