import Link from "next/link";
import { effectivePrice, formatUsd } from "@/lib/utils";
import { getProducts } from "@/lib/data/store";
import { Badge } from "@/components/ui/badge";

const visibilityVariant: Record<string, "success" | "muted" | "secondary"> = {
  public: "success",
  hidden: "muted",
  draft: "secondary",
};

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <span className="text-sm text-muted-foreground">
          {products.length} total
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
              <th className="px-4 py-3 font-medium">Inventory</th>
              <th className="px-4 py-3 text-right font-medium">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => {
              const price = effectivePrice(p.price, p.salePrice);
              const onSale = price < p.price;
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/product/${p.slug}`}
                      className="font-medium hover:text-primary"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.category}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium">{formatUsd(price)}</span>
                    {onSale && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        {formatUsd(p.price)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={visibilityVariant[p.visibility] ?? "muted"}>
                      {p.visibility}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.inventory < 0 ? "Unlimited" : p.inventory}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {p.rating.toFixed(1)} ({p.reviewCount})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Products are managed in your data source (Airtable when configured,
        otherwise the built-in demo catalog). This view is read-only in the MVP.
      </p>
    </div>
  );
}
