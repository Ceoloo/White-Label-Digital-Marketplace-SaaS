import type { Coupon } from "@/config/types";

export interface CouponEvaluation {
  valid: boolean;
  reason?: string;
  /** Discount amount in dollars for the given subtotal. */
  discount: number;
}

/**
 * Validate a coupon against a subtotal and compute the discount. Pure function
 * so it can run identically on the server (checkout) and client (cart preview).
 */
export function evaluateCoupon(
  coupon: Coupon | null,
  subtotal: number,
): CouponEvaluation {
  if (!coupon) {
    return { valid: false, reason: "Coupon not found.", discount: 0 };
  }
  if (!coupon.active) {
    return { valid: false, reason: "This coupon is no longer active.", discount: 0 };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, reason: "This coupon has expired.", discount: 0 };
  }
  if (
    typeof coupon.usageLimit === "number" &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return { valid: false, reason: "This coupon has reached its usage limit.", discount: 0 };
  }

  const raw =
    coupon.type === "percent"
      ? (subtotal * coupon.value) / 100
      : coupon.value;
  // Never discount below zero.
  const discount = Math.min(subtotal, Math.max(0, Math.round(raw * 100) / 100));
  return { valid: true, discount };
}
