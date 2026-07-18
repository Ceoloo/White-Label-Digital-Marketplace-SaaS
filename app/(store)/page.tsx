import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import marketplaceConfig from "@/config/marketplace.config";
import { getPublicProducts } from "@/lib/data/store";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    q: "How do I receive my purchase?",
    a: "Digital products are delivered instantly. After payment is confirmed your downloads unlock in your dashboard and a receipt is emailed to you.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Cards and wallets via Stripe, major cryptocurrencies, and Zelle. Crypto and Zelle are verified before access is granted.",
  },
  {
    q: "Do you offer refunds?",
    a: "Refund eligibility follows the store's refund policy. Reach out to support and we'll help.",
  },
];

const testimonials = [
  {
    quote:
      "Set up our entire storefront in an afternoon. The configuration-first approach is exactly what we needed.",
    name: "Jordan P.",
    role: "Founder, template studio",
  },
  {
    quote:
      "The rewards and referral system drove repeat purchases from day one.",
    name: "Amara K.",
    role: "Course creator",
  },
  {
    quote: "Clean, fast, and it just works on mobile. Our conversion went up.",
    name: "Devin R.",
    role: "Indie software seller",
  },
];

export default async function HomePage() {
  const products = await getPublicProducts();
  const featured = products.slice(0, 3);
  const newReleases = [...products]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 3);
  const popular = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 3);
  const { brand, categories } = marketplaceConfig;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container flex flex-col items-center py-24 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            {brand.tagline}
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            The marketplace for modern digital products
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            {brand.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/marketplace"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Browse the marketplace <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/rewards"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              See rewards
            </Link>
          </div>

          <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Zap, title: "Instant delivery", desc: "Downloads unlock the moment you pay." },
              { icon: ShieldCheck, title: "Secure checkout", desc: "Stripe, crypto, and Zelle supported." },
              { icon: Sparkles, title: "Earn rewards", desc: "Every purchase levels you up." },
            ].map((f) => (
              <Card key={f.title} className="text-left">
                <CardContent className="p-5">
                  <f.icon className="mb-2 size-5 text-primary" />
                  <div className="font-semibold">{f.title}</div>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <Section title="Featured products" href="/marketplace" cta="View all">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      {/* Categories */}
      <section className="border-y bg-muted/30">
        <div className="container py-16">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">Categories</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c}
                href={`/marketplace?category=${encodeURIComponent(c)}`}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border bg-card p-4 text-center text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular + New */}
      <Section title="Popular right now" href="/marketplace" cta="View all">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      <Section title="New releases" href="/marketplace" cta="View all">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {newReleases.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      <section className="border-t bg-muted/30">
        <div className="container py-16">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            Loved by creators
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="p-6">
                  <p className="text-sm leading-relaxed">“{t.quote}”</p>
                  <div className="mt-4 text-sm">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mx-auto max-w-3xl divide-y rounded-lg border">
          {faqs.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {f.q}
                <ArrowRight className="size-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function Section({
  title,
  href,
  cta,
  children,
}: {
  title: string;
  href: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container py-16">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {cta} <ArrowRight className="size-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}
