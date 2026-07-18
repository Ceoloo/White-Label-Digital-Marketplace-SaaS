# White-Label Digital Marketplace SaaS

A configuration-driven **marketplace engine** for digital products. Instead of a
storefront hardcoded for one niche, this is an "empty operating system" that any
digital-product business configures — branding, payments, rewards, categories,
AI services — **without rebuilding the platform**.

Built with Next.js (App Router), React, Tailwind CSS, and a shadcn-style design
system. It runs out of the box with built-in demo data and swaps to Airtable as
the operational data layer when credentials are provided.

---

## Highlights

- **One config file re-skins & re-configures everything** —
  [`config/marketplace.config.ts`](config/marketplace.config.ts) drives brand
  colors, logo, navigation, categories, payment methods, reward rules,
  promotions, feature toggles, and AI services.
- **Zero-setup data layer** — the app runs immediately on in-memory demo data.
  Set two env vars to switch to a live Airtable base. One seam
  ([`lib/data/store.ts`](lib/data/store.ts)) makes migrating to another database
  later a localized change.
- **Server-authoritative checkout** — prices are always re-computed from the
  catalog (never trusted from the client), coupons re-validated, and the
  first-purchase promotion applied on the server.
- **Multiple payment methods behind one interface** — Stripe (instant), crypto,
  and Zelle (manual verification), each enabled/disabled purely via config.
- **Gamification engine** — XP, configurable tiers (Bronze → Founder), badges,
  and referral rewards computed from pure functions.
- **Storefront + Admin** — full customer journey plus an admin dashboard with
  analytics, orders, products, coupons, and a white-label settings view.
- **Dark/Light mode**, mobile-first, accessible components.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

No accounts or keys are required — the app boots with a demo catalog, demo
customer, and demo coupons. To use live data or real payments, copy
`.env.example` to `.env.local` and fill in what you need.

```bash
cp .env.example .env.local
```

### Scripts

| Script              | Purpose                              |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Production build                     |
| `npm run start`     | Serve the production build           |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`)    |
| `npm run lint`      | ESLint via `next lint`               |

---

## How white-labeling works

Everything a client would change lives in
[`config/marketplace.config.ts`](config/marketplace.config.ts). Editing it
re-themes and re-configures the running app — no component changes required.

```ts
brand: {
  name: "Marketplace",
  primaryHsl: "243 75% 59%",   // ← swap to re-skin the whole UI
  accentHsl: "262 83% 58%",
  radius: "0.75rem",
  // ...
},
payments: [ /* enable/disable Stripe, crypto, Zelle */ ],
rewards: { xpPerDollar: 10, tiers: [...], badges: [...] },
promotions: { firstPurchaseDiscountPct: 10 },
features: { rewards: true, aiServices: true, wishlist: true, /* ... */ },
```

Brand colors and radius are injected as CSS variables at the root layout, so a
color change in config restyles buttons, badges, focus rings, gradients, and
more across both light and dark themes. Feature flags hide whole areas (e.g.
turn `features.rewards` off and the Rewards surfaces disappear).

The current configuration is visible read-only at **`/admin/settings`**.

---

## Architecture

```
config/
  marketplace.config.ts   # THE white-label control panel (single source of truth)
  types.ts                # config + domain model types (mirror Airtable schema)
lib/
  data/
    store.ts              # data-access facade — the swap seam
    airtable.ts           # Airtable REST adapter + field mappers
    mock.ts               # built-in demo data (products, users, coupons, orders)
  rewards.ts              # XP / tiers / badges (pure functions)
  coupons.ts              # coupon validation + discount math (pure)
  payments.ts             # payment method abstraction (Stripe/crypto/Zelle)
  utils.ts                # cn(), currency, pricing, slug/date helpers
app/
  (store)/                # storefront route group (shared header/footer)
    page.tsx              # homepage: hero, featured, categories, popular, FAQ
    marketplace/          # searchable/filterable catalog
    product/[slug]/       # product detail + purchase panel
    cart/  checkout/      # cart + server-authoritative checkout
    rewards/ downloads/ dashboard/ ai-services/ support/ legal/[slug]/
  admin/                  # admin dashboard (own layout + sidebar)
    page.tsx  orders/  products/  coupons/  settings/
  api/
    products/             # GET catalog
    coupons/validate/     # POST validate coupon against subtotal
    checkout/             # POST place order (re-price, coupon, promo, payment)
components/
  ui/                     # button, card, badge, input, progress (shadcn-style)
  cart-provider.tsx       # client cart (React context + localStorage)
  theme-provider.tsx      # next-themes wrapper (dark/light/system)
  site-header/-footer, product-card, marketplace-browser, ...
```

### Data layer

`lib/data/store.ts` is the single facade every page and API route reads through.
When `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are set it reads the live base;
otherwise it uses the in-memory demo data. If a live call fails it falls back to
demo data so the storefront stays up. This is the one place to change when
migrating to Postgres or another store as usage grows.

### Airtable schema

Tables (names overridable via env) follow the MVP scope:

- **Users** — Name, Email, Phone, Membership, Reward Points, Referral Code,
  Lifetime Spend, Status
- **Products** — Product Name, Description, Price, Sale Price, Images, Videos,
  Category, Download URL, Visibility, Inventory
- **Orders** — Order ID, Customer, Products, Total, Payment Method, Delivery
  Status, Refund Status
- **Coupons** — Promo Code, Discount, Expiration, Usage Limit, Active
- **Rewards**, **AI Services**, **Client Delivery**, **Audit Logs**

Field mappers live in [`lib/data/airtable.ts`](lib/data/airtable.ts); adjust
them if your base uses different field names.

### Payments

All three methods return a normalized instruction through
[`lib/payments.ts`](lib/payments.ts):

- **Stripe** — treated as instant in the MVP (in production, create a Checkout
  Session server-side and confirm via webhook). Order → `paid` / `delivered`.
- **Crypto** — returns configured wallet addresses; order → `verifying` pending
  on-chain confirmation.
- **Zelle** — returns recipient + order-ID memo for manual verification; order →
  `verifying`, surfaced in the admin **Orders** review queue.

### Rewards

[`lib/rewards.ts`](lib/rewards.ts) computes tier, progress to next tier, XP for a
purchase (per-dollar + first-purchase bonus), and evaluates badges — all from
the configured rules, so clients can rename/re-theme tiers and badges freely.

---

## AI Services (consent-first)

The optional AI service area is intentionally **consent-based**: workflows run
only with the customer's explicit authorization and are designed to comply with
applicable authentication and privacy policies, with a full audit trail and
human escalation. The architecture leaves configuration to administrators rather
than bundling specific tools; see `/ai-services` and the config's `aiServices`.

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Everything is optional for
local development. Groups:

- **Data** — `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` (+ optional table-name
  overrides)
- **Stripe** — `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET`
- **Crypto** — `CRYPTO_WALLET_BTC` / `_ETH` / `_USDC` / `_USDT`
- **Zelle** — `ZELLE_RECIPIENT_NAME` / `_EMAIL` / `_PHONE`

---

## MVP scope & notes

This is a template foundation, not a finished product for one business. Admin
views are read-only over the data source in the MVP; auth is represented by a
demo "current user" (wire in your auth provider of choice for production);
Stripe settlement is simulated pending real Checkout + webhooks. These are
deliberate seams left for the client's own integration, kept behind clean
interfaces so the core application doesn't change when they're filled in.
