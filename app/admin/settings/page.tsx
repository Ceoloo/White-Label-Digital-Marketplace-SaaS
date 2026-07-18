import marketplaceConfig from "@/config/marketplace.config";
import { dataSource } from "@/lib/data/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminSettingsPage() {
  const { brand, payments, features, rewards, promotions, categories } =
    marketplaceConfig;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">White-label settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          These values drive the entire storefront. In the MVP they live in{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">
            config/marketplace.config.ts
          </code>{" "}
          (or the Airtable White-Label Settings table). Editing them re-skins and
          re-configures the app without code changes.
        </p>
      </div>

      {/* Branding */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold">Branding</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={brand.name} />
            <Field label="Tagline" value={brand.tagline} />
            <Field label="Support email" value={brand.supportEmail} />
            <Field label="Corner radius" value={brand.radius} />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Primary</span>
              <span
                className="size-6 rounded-md border"
                style={{ background: `hsl(${brand.primaryHsl})` }}
              />
              <code className="text-xs">{brand.primaryHsl}</code>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Accent</span>
              <span
                className="size-6 rounded-md border"
                style={{ background: `hsl(${brand.accentHsl})` }}
              />
              <code className="text-xs">{brand.accentHsl}</code>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold">Payment methods</h2>
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.description}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.instant ? (
                    <Badge variant="success">Instant</Badge>
                  ) : (
                    <Badge variant="muted">Manual</Badge>
                  )}
                  <Badge variant={p.enabled ? "default" : "muted"}>
                    {p.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features + rules */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">Feature toggles</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(features).map(([k, v]) => (
                <Badge key={k} variant={v ? "success" : "muted"}>
                  {k}: {v ? "on" : "off"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">Reward & promotion rules</h2>
            <dl className="grid gap-3">
              <Field label="XP per $1" value={String(rewards.xpPerDollar)} />
              <Field
                label="First-purchase XP"
                value={String(rewards.firstPurchaseXp)}
              />
              <Field label="Referral XP" value={String(rewards.referralXp)} />
              <Field
                label="First-purchase discount"
                value={`${promotions.firstPurchaseDiscountPct}%`}
              />
              <Field label="Tiers" value={rewards.tiers.map((t) => t.label).join(", ")} />
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Categories + data source */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">Marketplace categories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">Data source</h2>
            <p className="text-sm text-muted-foreground">
              Currently reading from{" "}
              <Badge variant="muted">{dataSource()}</Badge>. Set{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">
                AIRTABLE_API_KEY
              </code>{" "}
              and{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">
                AIRTABLE_BASE_ID
              </code>{" "}
              to switch to live Airtable data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
