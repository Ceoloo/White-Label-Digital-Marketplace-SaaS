"use client";

import { useRouter } from "next/navigation";
import { Check, Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@/config/types";
import { effectivePrice, formatUsd } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart, toCartLine } from "@/components/cart-provider";
import * as React from "react";

export function ProductPurchase({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = React.useState(false);
  const [wished, setWished] = React.useState(false);

  const price = effectivePrice(product.price, product.salePrice);
  const onSale = price < product.price;

  const handleAdd = () => {
    add(toCartLine(product));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    add(toCartLine(product));
    router.push("/checkout");
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{formatUsd(price)}</span>
        {onSale && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatUsd(product.price)}
            </span>
            <Badge variant="sale">Sale</Badge>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" onClick={handleBuyNow}>
          Buy now
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={handleAdd}>
            {added ? (
              <>
                <Check className="size-4" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="size-4" /> Add to cart
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Add to wishlist"
            aria-pressed={wished}
            onClick={() => setWished((v) => !v)}
            className="h-11 w-11"
          >
            <Heart className={wished ? "fill-destructive text-destructive" : ""} />
          </Button>
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Check className="size-4 text-success" /> Instant digital delivery
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 text-success" /> Lifetime access &amp; updates
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 text-success" /> Secure checkout
        </li>
      </ul>
    </div>
  );
}
