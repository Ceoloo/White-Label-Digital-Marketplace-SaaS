import type { Metadata } from "next";
import Link from "next/link";
import { Download, Package, Star, Trophy } from "lucide-react";
import { cn, formatDate, formatUsd } from "@/lib/utils";
import marketplaceConfig from "@/config/marketplace.config";
import { getCurrentUser, getOrdersForEmail } from "@/lib/data/store";
import { nextTier, tierForXp, tierProgress } from "@/lib/rewards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account",
  description: "Your orders, downloads, and reward progress.",
};

const statusVariant: Record<
  string,
  "success" | "muted" | "secondary" | "sale"
> = {
  paid: "success",
  delivered: "success",
  verifying: "secondary",
  pending: "muted",
  failed: "sale",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const orders = user ? await getOrdersForEmail(user.email) : [];
  const xp = user?.rewardPoints ?? 0;
  const tier = tierForXp(xp);
  const next = nextTier(xp);

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s an overview of your account.
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="size-5" />}
          label="Orders"
          value={String(orders.length)}
        />
        <StatCard
          icon={<Trophy className="size-5" />}
          label="Tier"
          value={tier.label}
        />
        <StatCard
          icon={<Star className="size-5" />}
          label="Reward XP"
          value={xp.toLocaleString()}
        />
        <StatCard
          icon={<Download className="size-5" />}
          label="Lifetime spend"
          value={formatUsd(user?.lifetimeSpend ?? 0)}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent orders */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Recent orders</h2>
            <Link
              href="/downloads"
              className="text-sm font-medium text-primary hover:underline"
            >
              View downloads
            </Link>
          </div>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No orders yet.{" "}
                <Link href="/marketplace" className="text-primary underline">
                  Start shopping
                </Link>
                .
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y rounded-lg border">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{o.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {o.items.map((i) => i.name).join(", ")} ·{" "}
                      {formatDate(o.createdAt)}
                    </div>
                  </div>
                  <Badge variant={statusVariant[o.paymentStatus] ?? "muted"}>
                    {o.paymentStatus}
                  </Badge>
                  <div className="w-20 text-right font-medium">
                    {formatUsd(o.total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reward progress + quick links */}
        <aside className="space-y-6">
          {marketplaceConfig.features.rewards && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Trophy className="size-5 text-primary" />
                  <span className="font-semibold">{tier.label} member</span>
                </div>
                <Progress value={tierProgress(xp) * 100} />
                <p className="mt-2 text-sm text-muted-foreground">
                  {next
                    ? `${(next.minXp - xp).toLocaleString()} XP to ${next.label}`
                    : "You've reached the top tier!"}
                </p>
                <Link
                  href="/rewards"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-4 w-full",
                  )}
                >
                  View rewards
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 font-semibold">Quick links</h3>
              <div className="flex flex-col gap-1 text-sm">
                {[
                  { label: "My downloads", href: "/downloads" },
                  { label: "Rewards & badges", href: "/rewards" },
                  { label: "AI services", href: "/ai-services" },
                  { label: "Support", href: "/support" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-md px-2 py-2 hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
