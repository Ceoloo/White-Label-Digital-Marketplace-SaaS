import marketplaceConfig from "@/config/marketplace.config";
import type { RewardTier, User } from "@/config/types";

/**
 * Gamification engine. Pure functions that turn a user's activity + the
 * white-label reward rules into tiers, progress, and earned badges.
 */

const { rewards } = marketplaceConfig;

/** Resolve the current tier for a given XP total. */
export function tierForXp(xp: number): RewardTier {
  const sorted = [...rewards.tiers].sort((a, b) => a.minXp - b.minXp);
  let current = sorted[0];
  for (const tier of sorted) {
    if (xp >= tier.minXp) current = tier;
  }
  return current;
}

/** The next tier above the current one, or null if already at the top. */
export function nextTier(xp: number): RewardTier | null {
  const sorted = [...rewards.tiers].sort((a, b) => a.minXp - b.minXp);
  return sorted.find((t) => t.minXp > xp) ?? null;
}

/** Progress (0–1) toward the next tier. Returns 1 at the max tier. */
export function tierProgress(xp: number): number {
  const current = tierForXp(xp);
  const next = nextTier(xp);
  if (!next) return 1;
  const span = next.minXp - current.minXp;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (xp - current.minXp) / span));
}

/** XP granted for an order of the given dollar amount. */
export function xpForSpend(amount: number, isFirstPurchase: boolean): number {
  const base = Math.round(amount * rewards.xpPerDollar);
  return base + (isFirstPurchase ? rewards.firstPurchaseXp : 0);
}

export interface EarnedBadge {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
}

/**
 * Evaluate which badges a user has earned. Badge criteria are derived from the
 * configured badge ids so clients can rename/re-theme badges freely.
 */
export function evaluateBadges(
  user: Pick<User, "rewardPoints" | "lifetimeSpend">,
  opts: { orderCount: number; referralCount: number; memberNumber?: number },
): EarnedBadge[] {
  const xp = user.rewardPoints;
  const tier = tierForXp(xp);
  const gate: Record<string, boolean> = {
    "first-purchase": opts.orderCount >= 1,
    "top-supporter": user.lifetimeSpend >= 500,
    vip: xp >= (rewards.tiers.find((t) => t.id === "gold")?.minXp ?? Infinity),
    "referral-master": opts.referralCount >= 5,
    "early-access": (opts.memberNumber ?? Infinity) <= 100,
  };
  return rewards.badges.map((b) => ({
    id: b.id,
    label: b.label,
    description: b.description,
    icon: b.icon,
    earned: Boolean(gate[b.id]),
  }));
}

export { rewards as rewardsConfig, tierForXp as currentTier };
