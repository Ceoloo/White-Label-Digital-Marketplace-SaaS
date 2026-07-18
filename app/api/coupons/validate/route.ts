import { NextResponse } from "next/server";
import { getCouponByCode } from "@/lib/data/store";
import { evaluateCoupon } from "@/lib/coupons";

export const dynamic = "force-dynamic";

/** Validate a coupon code against a subtotal and return the discount. */
export async function POST(req: Request) {
  let body: { code?: string; subtotal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  const subtotal = Number(body.subtotal ?? 0);

  if (!code) {
    return NextResponse.json({ error: "Missing coupon code." }, { status: 400 });
  }
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "Invalid subtotal." }, { status: 400 });
  }

  const coupon = await getCouponByCode(code);
  const result = evaluateCoupon(coupon, subtotal);

  return NextResponse.json({
    code: code.toUpperCase(),
    ...result,
  });
}
