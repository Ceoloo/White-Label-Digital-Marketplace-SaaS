import type { MarketplaceConfig } from "./types";

/**
 * =============================================================================
 * THE WHITE-LABEL CONFIGURATION
 * =============================================================================
 * This single file is the "control panel" for the marketplace engine. A client
 * configures their entire storefront here — branding, navigation, payment
 * methods, reward rules, categories, and feature toggles — WITHOUT touching the
 * application code.
 *
 * In a production deployment this object would be sourced from the admin
 * dashboard / Airtable White-Label Settings table. For the MVP it lives in code
 * as the single source of truth and default configuration.
 * =============================================================================
 */
export const marketplaceConfig: MarketplaceConfig = {
  brand: {
    name: "Marketplace",
    tagline: "The operating system for your digital products",
    description:
      "A modern marketplace for digital products — configurable, fast, and built to scale from your first sale to your thousandth.",
    logoMark: "◆",
    logoUrl: "",
    supportEmail: "support@example.com",
    // Stripe-inspired indigo by default. Swap these two values to re-skin.
    primaryHsl: "243 75% 59%",
    accentHsl: "262 83% 58%",
    radius: "0.75rem",
  },

  nav: [
    { label: "Home", href: "/" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Rewards", href: "/rewards" },
    { label: "Downloads", href: "/downloads" },
    { label: "AI Services", href: "/ai-services" },
    { label: "Support", href: "/support" },
  ],

  adminNav: [
    { label: "Dashboard", href: "/admin" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Products", href: "/admin/products" },
    { label: "Coupons", href: "/admin/coupons" },
    { label: "Settings", href: "/admin/settings" },
  ],

  categories: [
    "Templates",
    "Courses",
    "eBooks",
    "Software",
    "Design Assets",
    "Audio",
  ],

  payments: [
    {
      id: "stripe",
      label: "Card / Apple Pay / Google Pay",
      description: "Pay securely with any major card. Settles instantly.",
      enabled: true,
      instant: true,
    },
    {
      id: "crypto",
      label: "Cryptocurrency",
      description: "Pay with BTC, ETH, USDC, or USDT. Verified on-chain.",
      enabled: true,
      instant: false,
    },
    {
      id: "zelle",
      label: "Zelle",
      description:
        "Send via Zelle and upload your confirmation for manual review.",
      enabled: true,
      instant: false,
    },
  ],

  rewards: {
    enabled: true,
    xpPerDollar: 10,
    firstPurchaseXp: 250,
    referralXp: 500,
    tiers: [
      { id: "bronze", label: "Bronze", minXp: 0, perk: "Welcome aboard" },
      { id: "silver", label: "Silver", minXp: 1000, perk: "Early access to sales" },
      { id: "gold", label: "Gold", minXp: 5000, perk: "5% loyalty discount" },
      { id: "diamond", label: "Diamond", minXp: 15000, perk: "10% loyalty discount" },
      { id: "founder", label: "Founder", minXp: 50000, perk: "Lifetime VIP pricing" },
    ],
    badges: [
      {
        id: "first-purchase",
        label: "First Purchase",
        description: "Completed your first order.",
        icon: "ShoppingBag",
      },
      {
        id: "top-supporter",
        label: "Top Supporter",
        description: "Reached $500 in lifetime spend.",
        icon: "Heart",
      },
      {
        id: "vip",
        label: "VIP",
        description: "Reached Gold tier or above.",
        icon: "Crown",
      },
      {
        id: "referral-master",
        label: "Referral Master",
        description: "Referred 5 or more customers.",
        icon: "Users",
      },
      {
        id: "early-access",
        label: "Early Access",
        description: "One of the first 100 members.",
        icon: "Sparkles",
      },
    ],
  },

  promotions: {
    firstPurchaseDiscountPct: 10,
    showSaleBadges: true,
  },

  aiServices: [
    {
      id: "consented-verification",
      label: "Consented Verification Agent",
      description:
        "Assists with customer-authorized identity and email/phone verification workflows. Requires explicit user consent and complies with applicable authentication and privacy policies.",
      enabled: true,
    },
  ],

  features: {
    rewards: true,
    aiServices: true,
    wishlist: true,
    reviews: true,
    downloads: true,
  },

  legal: {
    termsUrl: "/legal/terms",
    privacyUrl: "/legal/privacy",
    refundUrl: "/legal/refunds",
  },
};

export default marketplaceConfig;
