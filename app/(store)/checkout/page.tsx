"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Lock, Tag } from "lucide-react";
import type { PaymentMethodId } from "@/config/types";
import marketplaceConfig from "@/config/marketplace.config";
import { cn, formatUsd } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart-provider";

interface CheckoutResult {
  order: {
    id: string;
    subtotal: number;
    discount: number;
    total: number;
    paymentStatus: string;
    deliveryStatus: string;
    couponCode?: string;
    isFirstPurchase: boolean;
    serviceRequestsCreated?: number;
  };
  instruction: {
    method: PaymentMethodId;
    settlement: "instant" | "manual";
    message: string;
    details?: Record<string, string>;
  };
  xpEarned: number;
}

const enabledMethods = marketplaceConfig.payments.filter((p) => p.enabled);

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethodId>(
    enabledMethods[0]?.id ?? "stripe",
  );
  const [coupon, setCoupon] = React.useState("");
  const [couponMsg, setCouponMsg] = React.useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = React.useState(0);
  const [agree, setAgree] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<CheckoutResult | null>(null);

  const total = Math.max(0, subtotal - couponDiscount);

  async function applyCoupon() {
    setCouponMsg(null);
    if (!coupon.trim()) return;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponDiscount(data.discount);
        setCouponMsg(`Applied — you save ${formatUsd(data.discount)}.`);
      } else {
        setCouponDiscount(0);
        setCouponMsg(data.reason ?? "Invalid coupon.");
      }
    } catch {
      setCouponMsg("Could not validate coupon. Try again.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) {
      setError("Please accept the terms to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          paymentMethod: method,
          couponCode: coupon.trim() || undefined,
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed.");
        return;
      }
      setResult(data);
      clear();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Confirmation view -----------------------------------------------------
  if (result) {
    const paid = result.order.paymentStatus === "paid";
    return (
      <div className="container max-w-2xl py-16">
        <div className="rounded-lg border bg-card p-8 text-center">
          <div
            className={cn(
              "mx-auto mb-4 flex size-16 items-center justify-center rounded-full",
              paid ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
            )}
          >
            {paid ? <Check className="size-8" /> : <Lock className="size-8" />}
          </div>
          <h1 className="text-2xl font-bold">
            {paid ? "Payment confirmed" : "Almost there"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order {result.order.id} · {formatUsd(result.order.total)}
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm">
            {result.instruction.message}
          </p>

          {result.instruction.details && (
            <div className="mx-auto mt-6 max-w-md rounded-md border bg-muted/40 p-4 text-left text-sm">
              {Object.entries(result.instruction.details)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 border-b py-1.5 last:border-0"
                  >
                    <span className="text-muted-foreground">{k}</span>
                    <span className="break-all text-right font-medium">{v}</span>
                  </div>
                ))}
            </div>
          )}

          {result.xpEarned > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              +{result.xpEarned} XP earned
            </div>
          )}

          {result.order.serviceRequestsCreated
            ? (
                <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
                  Your purchase includes an AI-fulfilled service. Head to{" "}
                  <span className="font-medium text-foreground">My AI services</span>{" "}
                  to provide details and generate your deliverable.
                </p>
              )
            : null}

          <div className="mt-8 flex justify-center gap-3">
            {result.order.serviceRequestsCreated ? (
              <Link href="/services" className={cn(buttonVariants())}>
                Go to My AI services
              </Link>
            ) : (
              <Link href="/downloads" className={cn(buttonVariants())}>
                Go to downloads
              </Link>
            )}
            <Link
              href="/marketplace"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Empty cart ------------------------------------------------------------
  if (lines.length === 0) {
    return (
      <div className="container max-w-2xl py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/marketplace" className={cn(buttonVariants(), "mt-6")}>
          Browse products
        </Link>
      </div>
    );
  }

  // --- Checkout form ---------------------------------------------------------
  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          {/* Contact */}
          <section className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Full name</span>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Email</span>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </label>
            </div>
          </section>

          {/* Payment method */}
          <section className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Payment method</h2>
            <div className="space-y-3">
              {enabledMethods.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors",
                    method === m.id
                      ? "border-primary ring-1 ring-primary"
                      : "hover:bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="mt-1"
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      {m.label}
                      {m.instant ? (
                        <Badge variant="success">Instant</Badge>
                      ) : (
                        <Badge variant="muted">Manual review</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {m.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.productId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {l.name} × {l.quantity}
                </span>
                <span>{formatUsd(l.price * l.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="pl-9"
                />
              </div>
              <Button type="button" variant="outline" onClick={applyCoupon}>
                Apply
              </Button>
            </div>
            {couponMsg && (
              <p
                className={cn(
                  "mt-2 text-xs",
                  couponDiscount > 0 ? "text-success" : "text-destructive",
                )}
              >
                {couponMsg}
              </p>
            )}
          </div>

          <div className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatUsd(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>−{formatUsd(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatUsd(total)}</span>
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree to the{" "}
              <Link href={marketplaceConfig.legal.termsUrl} className="underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href={marketplaceConfig.legal.refundUrl}
                className="underline"
              >
                Refund Policy
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <Lock className="size-4" /> Pay {formatUsd(total)}
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            First-time customers may receive an automatic discount at checkout.
          </p>
        </aside>
      </form>
    </div>
  );
}
