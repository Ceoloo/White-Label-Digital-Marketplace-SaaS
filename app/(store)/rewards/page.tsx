import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Copy, Gift, Share2, Trophy } from "lucide-react";
import marketplaceConfig from "@/config/marketplace.config";
import { getCurrentUser, getOrdersForEmail } from "@/lib/data/store";
import {
  evaluateBadges,
  nextTier,
  tierForXp,
  tierProgress,
} from "@/lib/rewards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DynamicIcon } from "@/components/dynamic-icon";

export const metadata: Metadata = {
  title: "Rewards",
  description: "Earn XP, level up, and unlock perks with every purchase.",
};

export default async function RewardsPage() {
  if (!marketplaceConfig.features.rewards) notFound();
  const user = await getCurrentUser();
  const { rewards } = marketplaceConfig;

  const xp = user?.rewardPoints ?? 0;
  const tier = tierForXp(xp);
  const next = nextTier(xp);
  const progress = tierProgress(xp) * 100;
  const orders = user ? await getOrdersForEmail(user.email) : [];
  const badges = evaluateBadges(
    { rewardPoints: xp, lifetimeSpend: user?.lifetimeSpend ?? 0 },
    { orderCount: orders.length, referralCount: 0, memberNumber: 42 },
  );

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
        <p className="mt-2 text-muted-foreground">
          Earn {rewards.xpPerDollar} XP for every $1 you spend. Level up to
          unlock perks.
        </p>
      </header>

      {/* Progress card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Current tier
                </span>
              </div>
              <div className="mt-1 text-3xl font-bold">{tier.label}</div>
              {tier.perk && (
                <p className="text-sm text-muted-foreground">{tier.perk}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{xp.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">total XP</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex justify-between text-sm">
              <span>{tier.label}</span>
              <span className="text-muted-foreground">
                {next
                  ? `${(next.minXp - xp).toLocaleString()} XP to ${next.label}`
                  : "Max tier reached"}
              </span>
            </div>
            <Progress value={progress} />
          </div>
        </div>
      </Card>

      {/* Tiers */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold tracking-tight">All tiers</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {rewards.tiers.map((t) => {
            const reached = xp >= t.minXp;
            const isCurrent = t.id === tier.id;
            return (
              <Card
                key={t.id}
                className={
                  isCurrent ? "border-primary ring-1 ring-primary" : undefined
                }
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t.label}</span>
                    {reached && <Badge variant="success">Unlocked</Badge>}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {t.minXp.toLocaleString()} XP
                  </div>
                  {t.perk && <p className="mt-2 text-sm">{t.perk}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Badges */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold tracking-tight">Badges</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <Card key={b.id} className={b.earned ? undefined : "opacity-60"}>
              <CardContent className="flex items-start gap-4 p-5">
                <div
                  className={
                    "flex size-12 shrink-0 items-center justify-center rounded-full " +
                    (b.earned
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  <DynamicIcon name={b.icon} className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    {b.label}
                    {b.earned && <Badge variant="success">Earned</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {b.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Referral */}
      <section className="mt-10">
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Gift className="size-6" />
              </div>
              <div>
                <div className="font-semibold">Refer a friend</div>
                <p className="text-sm text-muted-foreground">
                  Earn {rewards.referralXp} XP for every friend who makes a
                  purchase.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                {user?.referralCode ?? "SIGN-IN-FOR-CODE"}
              </code>
              <span className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground">
                <Copy className="size-4" />
              </span>
              <span className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground">
                <Share2 className="size-4" />
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
