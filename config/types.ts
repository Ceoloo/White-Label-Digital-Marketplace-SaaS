/**
 * Shared domain + configuration types for the marketplace engine.
 *
 * These types describe both the white-label CONFIGURATION (branding, payments,
 * rewards rules, navigation) and the operational DATA MODEL (products, orders,
 * users, coupons) that mirrors the Airtable schema.
 */

// -----------------------------------------------------------------------------
// White-label configuration
// -----------------------------------------------------------------------------

export type PaymentMethodId = "stripe" | "crypto" | "zelle";

export interface BrandConfig {
  /** Display name used across the UI and metadata. */
  name: string;
  /** Short tagline shown in the hero and metadata description. */
  tagline: string;
  /** Longer description used for SEO / homepage. */
  description: string;
  /** Emoji or short text mark used as a lightweight logo placeholder. */
  logoMark: string;
  /** Optional URL to a logo image; falls back to `logoMark` when empty. */
  logoUrl?: string;
  /** Support email surfaced in the footer + support page. */
  supportEmail: string;
  /** Primary brand color as an HSL triplet string, e.g. "221 83% 53%". */
  primaryHsl: string;
  /** Accent color as an HSL triplet string. */
  accentHsl: string;
  /** Corner radius applied to the design system, e.g. "0.75rem". */
  radius: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface PaymentMethodConfig {
  id: PaymentMethodId;
  label: string;
  description: string;
  /** Whether the method is offered at checkout. */
  enabled: boolean;
  /** Whether it settles instantly (Stripe) vs. requires manual verification. */
  instant: boolean;
}

export interface RewardTier {
  id: string;
  label: string;
  /** Minimum lifetime XP required to reach this tier. */
  minXp: number;
  /** Optional perk description shown to the customer. */
  perk?: string;
}

export interface BadgeRule {
  id: string;
  label: string;
  description: string;
  /** Icon key (lucide icon name). */
  icon: string;
}

export interface RewardsConfig {
  enabled: boolean;
  /** XP granted per $1 of spend. */
  xpPerDollar: number;
  /** Flat XP granted for a customer's first purchase. */
  firstPurchaseXp: number;
  /** XP granted to the referrer when a referral converts. */
  referralXp: number;
  tiers: RewardTier[];
  badges: BadgeRule[];
}

export interface PromotionsConfig {
  /** Percentage discount automatically applied to a first purchase (0 = off). */
  firstPurchaseDiscountPct: number;
  /** Whether flash-sale / sale pricing badges are shown. */
  showSaleBadges: boolean;
}

export interface AiServiceConfig {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface MarketplaceConfig {
  brand: BrandConfig;
  /** Public storefront navigation. */
  nav: NavItem[];
  /** Admin dashboard navigation. */
  adminNav: NavItem[];
  /** Product categories offered by this client. */
  categories: string[];
  payments: PaymentMethodConfig[];
  rewards: RewardsConfig;
  promotions: PromotionsConfig;
  aiServices: AiServiceConfig[];
  /** Toggle high-level feature areas per client. */
  features: {
    rewards: boolean;
    aiServices: boolean;
    wishlist: boolean;
    reviews: boolean;
    downloads: boolean;
  };
  legal: {
    termsUrl: string;
    privacyUrl: string;
    refundUrl: string;
  };
}

// -----------------------------------------------------------------------------
// Operational data model (mirrors the Airtable schema)
// -----------------------------------------------------------------------------

export type ProductVisibility = "public" | "hidden" | "draft";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  features: string[];
  requirements: string[];
  price: number;
  salePrice?: number;
  images: string[];
  videoUrl?: string;
  category: string;
  downloadUrl?: string;
  visibility: ProductVisibility;
  /** -1 = unlimited (typical for digital goods). */
  inventory: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export type MembershipTier = "Bronze" | "Silver" | "Gold" | "Diamond" | "Founder";
export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  membership: MembershipTier;
  rewardPoints: number;
  referralCode: string;
  lifetimeSpend: number;
  status: UserStatus;
}

export type PaymentStatus = "pending" | "verifying" | "paid" | "failed";
export type DeliveryStatus = "pending" | "delivered";
export type RefundStatus = "none" | "requested" | "refunded";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethodId;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  refundStatus: RefundStatus;
  /** Method-specific reference (crypto tx hash, Zelle confirmation #, etc.). */
  paymentReference?: string;
  createdAt: string;
}

export interface Coupon {
  code: string;
  /** "percent" applies `value`% off; "fixed" applies `$value` off. */
  type: "percent" | "fixed";
  value: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
}
