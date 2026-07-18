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
    { label: "My Services", href: "/services" },
    { label: "AI Services", href: "/ai-services" },
    { label: "Privacy", href: "/privacy" },
    { label: "Support", href: "/support" },
  ],

  adminNav: [
    { label: "Dashboard", href: "/admin" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Products", href: "/admin/products" },
    { label: "AI Services", href: "/admin/services" },
    { label: "Coupons", href: "/admin/coupons" },
    { label: "Privacy", href: "/admin/privacy" },
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

  privacy: {
    enabled: true,
    // Approved egress providers. All are OFF by default — an operator turns one
    // on only after pointing the matching env var at an endpoint they run and
    // are authorized to use. The app routes its own server-side outbound
    // requests through the active provider; it never proxies end-user browsing.
    providers: [
      {
        id: "vpn-gateway",
        label: "VPN egress gateway",
        kind: "vpn",
        description:
          "Route the app's outbound server-to-server traffic through your corporate VPN or a dedicated egress gateway.",
        enabled: false,
        envVar: "PRIVACY_VPN_PROXY_URL",
      },
      {
        id: "tor-egress",
        label: "Tor / SOCKS egress",
        kind: "tor",
        description:
          "Send privacy-sensitive outbound requests through an authorized Tor or SOCKS5 egress you operate. Bring your own vetted endpoint; nothing is bundled.",
        enabled: false,
        envVar: "PRIVACY_TOR_PROXY_URL",
      },
      {
        id: "http-proxy",
        label: "HTTP forward proxy",
        kind: "proxy",
        description:
          "Use a standard authenticated HTTP/HTTPS forward proxy for compliance-scoped egress.",
        enabled: false,
        envVar: "PRIVACY_HTTP_PROXY_URL",
      },
    ],
    encryption: { atRest: true, inTransit: true },
    compliance: {
      auditLogging: true,
      dataRetentionDays: 90,
      region: "US",
    },
    permissions: {
      requireAdminApproval: true,
      sessionTimeoutMinutes: 30,
    },
    tor: {
      // Offer a .onion to Tor Browser users when an address is configured.
      // Supply the address via the ONION_URL env var (kept out of source).
      advertiseOnion: true,
      onionUrl: "",
    },
  },

  features: {
    rewards: true,
    aiServices: true,
    privacy: true,
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
