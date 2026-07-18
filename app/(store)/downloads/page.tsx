import type { Metadata } from "next";
import Link from "next/link";
import { Download, Package } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  getCurrentUser,
  getOrdersForEmail,
  getProductById,
} from "@/lib/data/store";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Downloads",
  description: "Access every digital product you've purchased.",
};

interface DownloadEntry {
  productName: string;
  slug: string | null;
  downloadUrl?: string;
  orderId: string;
  purchasedAt: string;
  delivered: boolean;
}

export default async function DownloadsPage() {
  const user = await getCurrentUser();
  const orders = user ? await getOrdersForEmail(user.email) : [];

  const entries: DownloadEntry[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      const product = await getProductById(item.productId);
      entries.push({
        productName: item.name,
        slug: product?.slug ?? null,
        downloadUrl: product?.downloadUrl,
        orderId: order.id,
        purchasedAt: order.createdAt,
        delivered: order.deliveryStatus === "delivered",
      });
    }
  }

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
        <p className="mt-2 text-muted-foreground">
          Your purchased products. Downloads unlock once payment is confirmed.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <Package className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">No downloads yet</p>
          <p className="text-sm text-muted-foreground">
            Purchases will appear here automatically.
          </p>
          <Link href="/marketplace" className={cn(buttonVariants(), "mt-6")}>
            Browse products
          </Link>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {entries.map((e, i) => (
            <div
              key={`${e.orderId}-${i}`}
              className="flex items-center gap-4 p-4"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-accent/10 font-semibold text-muted-foreground/50">
                {e.productName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{e.productName}</div>
                <div className="text-sm text-muted-foreground">
                  Order {e.orderId} · {formatDate(e.purchasedAt)}
                </div>
              </div>
              {e.delivered && e.downloadUrl ? (
                <a
                  href={e.downloadUrl}
                  className={cn(buttonVariants({ size: "sm" }))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-4" /> Download
                </a>
              ) : (
                <Badge variant="muted">
                  {e.delivered ? "No file" : "Awaiting payment"}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
