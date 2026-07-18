"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { cn, formatUsd } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";

export default function CartPage() {
  const { lines, subtotal, setQuantity, remove } = useCart();

  if (lines.length === 0) {
    return (
      <div className="container flex flex-col items-center py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="size-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Browse the marketplace to find your next digital product.
        </p>
        <Link href="/marketplace" className={cn(buttonVariants(), "mt-6")}>
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Shopping cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="divide-y rounded-lg border">
          {lines.map((line) => (
            <div key={line.productId} className="flex items-center gap-4 p-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-accent/10 text-lg font-semibold text-muted-foreground/50">
                {line.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${line.slug}`}
                  className="font-medium hover:text-primary"
                >
                  {line.name}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {formatUsd(line.price)} each
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(line.productId, line.quantity - 1)}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-8 text-center text-sm">{line.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(line.productId, line.quantity + 1)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <div className="w-20 text-right font-medium">
                {formatUsd(line.price * line.quantity)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${line.name}`}
                onClick={() => remove(line.productId)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatUsd(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Coupons and eligible promotions are applied at checkout.
          </p>
          <Link
            href="/checkout"
            className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}
          >
            Proceed to checkout
          </Link>
          <Link
            href="/marketplace"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
