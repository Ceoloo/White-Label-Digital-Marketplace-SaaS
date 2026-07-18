"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/config/types";
import { cn, effectivePrice, formatUsd } from "@/lib/utils";
import marketplaceConfig from "@/config/marketplace.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart, toCartLine } from "@/components/cart-provider";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const price = effectivePrice(product.price, product.salePrice);
  const onSale = price < product.price;
  const discountPct = onSale
    ? Math.round((1 - price / product.price) * 100)
    : 0;
  const soldOut = product.inventory === 0;
  const lowStock = product.inventory > 0 && product.inventory <= 5;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-accent/10">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-4xl font-semibold text-muted-foreground/40">
              {product.name.charAt(0)}
            </span>
          )}
          {marketplaceConfig.promotions.showSaleBadges && onSale && !soldOut && (
            <Badge variant="sale" className="absolute left-3 top-3">
              {discountPct}% off
            </Badge>
          )}
          {soldOut && (
            <Badge variant="muted" className="absolute left-3 top-3">
              Sold out
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Badge variant="muted">{product.category}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-current text-amber-400" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        <Link href={`/product/${product.slug}`}>
          <h3 className="line-clamp-1 font-semibold group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {product.description}
        </p>

        {lowStock && (
          <p className="mt-2 text-xs font-medium text-amber-600">
            Only {product.inventory} left
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">{formatUsd(price)}</span>
            {onSale && (
              <span className={cn("text-sm text-muted-foreground line-through")}>
                {formatUsd(product.price)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            disabled={soldOut}
            onClick={() => add(toCartLine(product))}
          >
            {soldOut ? "Sold out" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
