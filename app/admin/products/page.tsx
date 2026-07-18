import marketplaceConfig from "@/config/marketplace.config";
import { getProducts } from "@/lib/data/store";
import { AdminProductsManager } from "@/components/admin-products-manager";

// Catalog is mutated via the admin API; always render the latest.
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <AdminProductsManager
      initialProducts={products}
      categories={marketplaceConfig.categories}
    />
  );
}
