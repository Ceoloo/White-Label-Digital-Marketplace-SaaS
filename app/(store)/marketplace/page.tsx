import type { Metadata } from "next";
import marketplaceConfig from "@/config/marketplace.config";
import { getPublicProducts } from "@/lib/data/store";
import { MarketplaceBrowser } from "@/components/marketplace-browser";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse every digital product in the store.",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const products = await getPublicProducts();

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="mt-2 text-muted-foreground">
          {products.length} digital products, ready to download.
        </p>
      </header>
      <MarketplaceBrowser
        products={products}
        categories={marketplaceConfig.categories}
        initialCategory={category}
      />
    </div>
  );
}
