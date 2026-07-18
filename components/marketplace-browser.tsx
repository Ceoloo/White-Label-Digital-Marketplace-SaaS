"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { Product } from "@/config/types";
import { effectivePrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating", label: "Top rated" },
];

export function MarketplaceBrowser({
  products,
  categories,
  initialCategory,
}: {
  products: Product[];
  categories: string[];
  initialCategory?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>(
    initialCategory && categories.includes(initialCategory)
      ? initialCategory
      : "All",
  );
  const [sort, setSort] = React.useState<SortKey>("featured");

  const filtered = React.useMemo(() => {
    let list = products.slice();
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    switch (sort) {
      case "price-asc":
        list.sort(
          (a, b) =>
            effectivePrice(a.price, a.salePrice) -
            effectivePrice(b.price, b.salePrice),
        );
        break;
      case "price-desc":
        list.sort(
          (a, b) =>
            effectivePrice(b.price, b.salePrice) -
            effectivePrice(a.price, a.salePrice),
        );
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      default:
        break;
    }
    return list;
  }, [products, category, query, sort]);

  const allCategories = ["All", ...categories];

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Sort products"
        >
          {sortOptions.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {allCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {filtered.length} product{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No products match your filters.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
