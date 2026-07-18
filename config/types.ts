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

// -----------------------------------------------------------------------------
// Privacy Suite
// -----------------------------------------------------------------------------
//
// The privacy layer is intentionally *configuration-driven*. Rather than
// bundling a VPN client or Tor binary into the application, operators point the
// app at an APPROVED, compliance-vetted egress they run themselves (a corporate
// VPN gateway, an authorized SOCKS/Tor egress, or an HTTP proxy). The app reads
// those endpoints from environment variables and can route its own *server-side
// outbound* requests (e.g. webhooks, third-party API calls) through them. It
// does NOT anonymize end-user browsing or bypass any security controls.

export type PrivacyProviderKind = "vpn" | "tor" | "proxy";

export interface PrivacyProviderConfig {
  id: string;
  label: string;
  kind: PrivacyProviderKind;
  description: string;
  /** Whether the operator has opted this provider in. */
  enabled: boolean;
  /**
   * Name of the environment variable that supplies the provider's endpoint
   * (e.g. a SOCKS5 or HTTP proxy URL). The value is never committed to config.
   */
  envVar: string;
}

export interface PrivacyConfig {
  enabled: boolean;
  /** Approved egress/privacy providers the operator can turn on. */
  providers: PrivacyProviderConfig[];
  encryption: {
    /** Data encrypted at rest by the storage/provider layer. */
    atRest: boolean;
    /** TLS enforced for all connections. */
    inTransit: boolean;
  };
  compliance: {
    /** Whether privacy-relevant events are written to the audit log. */
    auditLogging: boolean;
    /** Retention window for logs/personal data, in days. */
    dataRetentionDays: number;
    /** Data-residency region label shown in the dashboard. */
    region: string;
  };
  permissions: {
    /** Sensitive privacy changes require an admin to approve. */
    requireAdminApproval: boolean;
    /** Idle session timeout (minutes) before re-authentication. */
    sessionTimeoutMinutes: number;
  };
  /**
   * Tor hidden-service (.onion) support. When advertised, the app sends an
   * `Onion-Location` header + meta tag so Tor Browser users are offered the
   * .onion address. The app does NOT run Tor — the operator runs the hidden
   * service and supplies its address (usually via the ONION_URL env var).
   */
  tor: {
    /** Advertise the hidden service to Tor Browser users. */
    advertiseOnion: boolean;
    /** Default v3 .onion address; usually supplied via ONION_URL instead. */
    onionUrl: string;
  };
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
  privacy: PrivacyConfig;
  /** Toggle high-level feature areas per client. */
  features: {
    rewards: boolean;
    aiServices: boolean;
    privacy: boolean;
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

/** A digital download vs. an AI-fulfilled service. */
export type ProductType = "digital" | "service";

/** One input field a customer fills in when requesting an AI service. */
export interface ServiceInput {
  id: string;
  label: string;
  placeholder?: string;
  /** Single-line vs. multi-line input. */
  multiline?: boolean;
  required?: boolean;
}

/**
 * Configuration for an AI-fulfilled service. When a `service`-type product is
 * purchased, the buyer provides these inputs and the AI produces the deliverable
 * per `instructions`. `systemPrompt` and `model` are optional overrides.
 */
export interface ServiceConfig {
  inputs: ServiceInput[];
  /** What the AI should produce (the task/prompt template). */
  instructions: string;
  systemPrompt?: string;
  model?: string;
  /** Short description of the output format shown to the buyer. */
  deliveryFormat?: string;
}

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
  /** "digital" (a download) or "service" (fulfilled by AI). Defaults to digital. */
  type: ProductType;
  /** Present when `type === "service"`. */
  service?: ServiceConfig;
}

export type ServiceRequestStatus =
  | "pending" // purchased, awaiting customer inputs
  | "processing" // AI is generating
  | "completed"
  | "failed";

/** A purchased instance of a service being fulfilled by AI. */
export interface ServiceRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  inputs: Record<string, string>;
  status: ServiceRequestStatus;
  /** The AI-generated deliverable (present once completed). */
  deliverable?: string;
  /** Model that produced it, or "simulated" in demo mode. */
  fulfilledBy?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
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

// -----------------------------------------------------------------------------
// Privacy / security telemetry (Audit Logs + Device Monitoring)
// -----------------------------------------------------------------------------

export type SecurityEventLevel = "info" | "warning" | "critical";

export interface SecurityEvent {
  id: string;
  userEmail: string;
  event: string;
  level: SecurityEventLevel;
  device: string;
  /** Egress path the request took, e.g. "direct", "vpn", "tor". */
  channel: string;
  createdAt: string;
}

export interface DeviceSession {
  id: string;
  userEmail: string;
  device: string;
  location: string;
  lastActive: string;
  trusted: boolean;
  current: boolean;
}
