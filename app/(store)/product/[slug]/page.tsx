import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, Star } from "lucide-react";
import { getProductBySlug, getPublicProducts } from "@/lib/data/store";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { ProductPurchase } from "@/components/product-purchase";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.visibility !== "public") notFound();

  const related = (await getPublicProducts())
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="container py-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to marketplace
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {/* Gallery */}
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-gradient-to-br from-primary/10 via-muted to-accent/10">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-6xl font-semibold text-muted-foreground/30">
                {product.name.charAt(0)}
              </span>
            )}
          </div>

          {product.videoUrl && (
            <div className="mt-4 aspect-video overflow-hidden rounded-lg border">
              <iframe
                src={product.videoUrl}
                title={`${product.name} preview`}
                className="h-full w-full"
                allowFullScreen
              />
            </div>
          )}

          {/* Description */}
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-semibold">Description</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </section>

            {product.features.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold">What&apos;s included</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {product.requirements.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold">Requirements</h2>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {product.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < Math.round(product.rating)
                          ? "size-5 fill-amber-400 text-amber-400"
                          : "size-5 text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating.toFixed(1)} · {product.reviewCount} reviews
                </span>
              </div>
            </section>
          </div>
        </div>

        {/* Purchase panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="muted">{product.category}</Badge>
          </div>
          <h1 className="mb-4 text-2xl font-bold tracking-tight">
            {product.name}
          </h1>
          <ProductPurchase product={product} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold tracking-tight">
            Related products
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
