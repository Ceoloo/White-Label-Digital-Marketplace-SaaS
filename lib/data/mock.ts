import type {
  Coupon,
  DeviceSession,
  Order,
  Product,
  SecurityEvent,
  ServiceRequest,
  User,
} from "@/config/types";

/**
 * Built-in demo data. This lets the entire application run, be developed, and
 * be demoed with zero external services. When Airtable credentials are present
 * the store swaps this out for live data (see `lib/data/store.ts`).
 *
 * The arrays are mutated in-memory during a server session so that actions like
 * "place order" behave realistically in the demo. They reset on restart.
 */

const seedDigitalProducts: Omit<Product, "type" | "service">[] = [
  {
    id: "prod_starter_kit",
    slug: "founders-starter-kit",
    name: "Founder's Starter Kit",
    description:
      "Everything you need to launch your first digital product business: notion templates, a pricing calculator, and a launch checklist.",
    features: [
      "40+ Notion templates",
      "Pricing & margin calculator",
      "30-day launch checklist",
      "Lifetime updates",
    ],
    requirements: ["A free Notion account", "Any modern browser"],
    price: 49,
    salePrice: 29,
    images: [],
    videoUrl: "",
    category: "Templates",
    downloadUrl: "https://example.com/downloads/founders-starter-kit.zip",
    visibility: "public",
    inventory: -1,
    rating: 4.8,
    reviewCount: 214,
    createdAt: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "prod_growth_course",
    slug: "digital-growth-course",
    name: "Digital Growth Masterclass",
    description:
      "A 6-hour video course on acquisition, retention, and monetization for solo digital founders.",
    features: [
      "6 hours of HD video",
      "Downloadable worksheets",
      "Private community access",
      "Certificate of completion",
    ],
    requirements: ["No prior experience required"],
    price: 129,
    images: [],
    videoUrl: "",
    category: "Courses",
    downloadUrl: "https://example.com/downloads/growth-course",
    visibility: "public",
    inventory: -1,
    rating: 4.9,
    reviewCount: 88,
    createdAt: "2026-02-02T10:00:00.000Z",
  },
  {
    id: "prod_ui_pack",
    slug: "saas-ui-component-pack",
    name: "SaaS UI Component Pack",
    description:
      "120 production-ready React + Tailwind components designed for modern SaaS dashboards.",
    features: [
      "120 components",
      "Dark & light variants",
      "Figma source included",
      "MIT-friendly license",
    ],
    requirements: ["React 18+", "Tailwind CSS 3+"],
    price: 79,
    salePrice: 59,
    images: [],
    videoUrl: "",
    category: "Design Assets",
    downloadUrl: "https://example.com/downloads/saas-ui-pack.zip",
    visibility: "public",
    inventory: -1,
    rating: 4.7,
    reviewCount: 156,
    createdAt: "2026-03-15T10:00:00.000Z",
  },
  {
    id: "prod_ebook",
    slug: "the-lean-launch-ebook",
    name: "The Lean Launch (eBook)",
    description:
      "A concise, no-fluff guide to shipping and selling your first digital product in 14 days.",
    features: ["180 pages", "PDF + ePub", "Real case studies"],
    requirements: ["Any e-reader or PDF viewer"],
    price: 19,
    images: [],
    videoUrl: "",
    category: "eBooks",
    downloadUrl: "https://example.com/downloads/lean-launch.epub",
    visibility: "public",
    inventory: -1,
    rating: 4.6,
    reviewCount: 302,
    createdAt: "2026-01-28T10:00:00.000Z",
  },
  {
    id: "prod_automation",
    slug: "automation-toolkit",
    name: "No-Code Automation Toolkit",
    description:
      "A library of pre-built automation blueprints to run your store on autopilot.",
    features: [
      "35 automation blueprints",
      "Works with popular no-code tools",
      "Step-by-step setup guides",
    ],
    requirements: ["A no-code automation account"],
    price: 89,
    images: [],
    videoUrl: "",
    category: "Software",
    downloadUrl: "https://example.com/downloads/automation-toolkit.zip",
    visibility: "public",
    inventory: -1,
    rating: 4.5,
    reviewCount: 47,
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "prod_audio",
    slug: "focus-soundscapes",
    name: "Focus Soundscapes Vol. 1",
    description:
      "Two hours of royalty-free ambient audio engineered for deep work sessions.",
    features: ["12 tracks", "Lossless + MP3", "Royalty-free license"],
    requirements: ["Any audio player"],
    price: 15,
    images: [],
    videoUrl: "",
    category: "Audio",
    downloadUrl: "https://example.com/downloads/focus-soundscapes.zip",
    visibility: "public",
    inventory: -1,
    rating: 4.4,
    reviewCount: 63,
    createdAt: "2026-05-10T10:00:00.000Z",
  },
];

/** A demo AI-fulfilled service the admin can sell out of the box. */
const seedServices: Product[] = [
  {
    id: "svc_landing_copy",
    slug: "ai-landing-page-copywriter",
    name: "AI Landing Page Copywriter",
    description:
      "Tell us about your product and audience, and our AI writes conversion-focused landing page copy — headline, subhead, benefits, and CTA.",
    features: [
      "Delivered by AI within minutes",
      "Headline, subhead, 3 benefits, and CTA",
      "Tailored to your audience & tone",
      "Unlimited edits to your brief",
    ],
    requirements: ["A short description of your product"],
    price: 25,
    images: [],
    videoUrl: "",
    category: "Software",
    visibility: "public",
    inventory: -1,
    rating: 4.9,
    reviewCount: 37,
    createdAt: "2026-06-01T10:00:00.000Z",
    type: "service",
    service: {
      instructions:
        "Write high-converting landing page copy for the product described below. Return: a punchy headline, a one-sentence subheadline, three benefit bullets, and a strong call-to-action. Match the requested tone. Format the result as clean Markdown.",
      deliveryFormat: "Markdown copy block",
      inputs: [
        {
          id: "f1_product",
          label: "What is your product or service?",
          placeholder: "e.g. A budgeting app for freelancers",
          multiline: true,
          required: true,
        },
        {
          id: "f2_audience",
          label: "Who is your target audience?",
          placeholder: "e.g. Freelancers and solo founders",
          multiline: true,
          required: true,
        },
        {
          id: "f3_tone",
          label: "What tone should the copy have?",
          placeholder: "e.g. Confident and friendly",
          multiline: false,
          required: false,
        },
      ],
    },
  },
];

export const mockProducts: Product[] = [
  ...seedDigitalProducts.map(
    (p): Product => ({ ...p, type: "digital" as const }),
  ),
  ...seedServices,
];

export const mockServiceRequests: ServiceRequest[] = [];

export const mockUsers: User[] = [
  {
    id: "user_demo",
    name: "Demo Customer",
    email: "demo@example.com",
    phone: "",
    membership: "Silver",
    rewardPoints: 1450,
    referralCode: "DEMO-1450",
    lifetimeSpend: 178,
    status: "active",
  },
];

export const mockCoupons: Coupon[] = [
  {
    code: "WELCOME10",
    type: "percent",
    value: 10,
    usageLimit: 1000,
    usedCount: 42,
    active: true,
  },
  {
    code: "SAVE15",
    type: "fixed",
    value: 15,
    usageLimit: 200,
    usedCount: 11,
    active: true,
  },
  {
    code: "EXPIRED",
    type: "percent",
    value: 50,
    expiresAt: "2026-01-01T00:00:00.000Z",
    usedCount: 5,
    active: false,
  },
];

export const mockSecurityEvents: SecurityEvent[] = [
  {
    id: "evt_1",
    userEmail: "demo@example.com",
    event: "Successful sign-in",
    level: "info",
    device: "Chrome · macOS",
    channel: "direct",
    createdAt: "2026-07-18T09:14:00.000Z",
  },
  {
    id: "evt_2",
    userEmail: "demo@example.com",
    event: "Password changed",
    level: "info",
    device: "Chrome · macOS",
    channel: "direct",
    createdAt: "2026-07-17T18:02:00.000Z",
  },
  {
    id: "evt_3",
    userEmail: "demo@example.com",
    event: "New device signed in",
    level: "warning",
    device: "Safari · iPhone",
    channel: "direct",
    createdAt: "2026-07-16T21:40:00.000Z",
  },
  {
    id: "evt_4",
    userEmail: "demo@example.com",
    event: "Blocked sign-in attempt (wrong 2FA)",
    level: "critical",
    device: "Unknown · Linux",
    channel: "tor",
    createdAt: "2026-07-15T03:11:00.000Z",
  },
];

export const mockDeviceSessions: DeviceSession[] = [
  {
    id: "dev_1",
    userEmail: "demo@example.com",
    device: "Chrome · macOS",
    location: "Austin, US",
    lastActive: "2026-07-18T09:14:00.000Z",
    trusted: true,
    current: true,
  },
  {
    id: "dev_2",
    userEmail: "demo@example.com",
    device: "Safari · iPhone",
    location: "Austin, US",
    lastActive: "2026-07-16T21:40:00.000Z",
    trusted: true,
    current: false,
  },
];

export const mockOrders: Order[] = [
  {
    id: "ord_1001",
    customerEmail: "demo@example.com",
    customerName: "Demo Customer",
    items: [
      { productId: "prod_ebook", name: "The Lean Launch (eBook)", price: 19, quantity: 1 },
    ],
    subtotal: 19,
    discount: 0,
    total: 19,
    paymentMethod: "stripe",
    paymentStatus: "paid",
    deliveryStatus: "delivered",
    refundStatus: "none",
    createdAt: "2026-06-20T14:30:00.000Z",
  },
];
