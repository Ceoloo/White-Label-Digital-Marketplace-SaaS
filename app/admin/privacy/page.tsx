import { notFound } from "next/navigation";
import { Globe, Lock, Network, ShieldCheck } from "lucide-react";
import marketplaceConfig from "@/config/marketplace.config";
import { getPrivacyStatus } from "@/lib/privacy";
import { getSecurityEvents } from "@/lib/data/store";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Reads egress configuration from the environment at request time.
export const dynamic = "force-dynamic";

const kindIcon: Record<string, React.ReactNode> = {
  vpn: <ShieldCheck className="size-5" />,
  tor: <Network className="size-5" />,
  proxy: <Globe className="size-5" />,
};

const levelVariant: Record<string, "muted" | "secondary" | "sale"> = {
  info: "muted",
  warning: "secondary",
  critical: "sale",
};

export default async function AdminPrivacyPage() {
  if (!marketplaceConfig.features.privacy) notFound();

  const status = getPrivacyStatus();
  const events = await getSecurityEvents();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Privacy &amp; security</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Configure approved egress providers for the app&apos;s server-side
          outbound traffic and monitor security events. No VPN or Tor client is
          bundled — each provider points at an endpoint you operate and are
          authorized to use. Enable a provider in{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">
            config/marketplace.config.ts
          </code>{" "}
          and set its environment variable.
        </p>
      </div>

      {/* Active egress banner */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Network className="size-5" />
            </div>
            <div>
              <div className="font-semibold">Outbound egress channel</div>
              <div className="text-sm text-muted-foreground">
                Where the app routes its own server-to-server requests.
              </div>
            </div>
          </div>
          <Badge variant={status.channel === "direct" ? "muted" : "success"}>
            {status.channel === "direct"
              ? "Direct (no egress provider active)"
              : `${status.channel.toUpperCase()} active`}
          </Badge>
        </CardContent>
      </Card>

      {/* Providers */}
      <section>
        <h2 className="mb-4 font-semibold">Egress providers</h2>
        <div className="space-y-3">
          {status.providers.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {kindIcon[p.kind]}
                  </div>
                  <div>
                    <div className="font-medium">{p.label}</div>
                    <div className="max-w-xl text-sm text-muted-foreground">
                      {p.description}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Env:{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        {p.envVar}
                      </code>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={p.enabled ? "default" : "muted"}>
                    {p.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Badge variant={p.configured ? "success" : "muted"}>
                    {p.configured ? "Endpoint set" : "No endpoint"}
                  </Badge>
                  <Badge variant={p.active ? "success" : "muted"}>
                    {p.active ? "Active" : "Idle"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Compliance + encryption */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="size-5 text-primary" />
              <h2 className="font-semibold">Encryption &amp; compliance</h2>
            </div>
            <dl className="grid gap-3 text-sm">
              <Row label="Encryption at rest" value={status.encryption.atRest ? "On" : "Off"} />
              <Row label="Encryption in transit" value={status.encryption.inTransit ? "On" : "Off"} />
              <Row label="Audit logging" value={status.compliance.auditLogging ? "On" : "Off"} />
              <Row label="Data region" value={status.compliance.region} />
              <Row
                label="Data retention"
                value={`${status.compliance.dataRetentionDays} days`}
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h2 className="font-semibold">Access controls</h2>
            </div>
            <dl className="grid gap-3 text-sm">
              <Row
                label="Admin approval required"
                value={status.permissions.requireAdminApproval ? "Yes" : "No"}
              />
              <Row
                label="Session timeout"
                value={`${status.permissions.sessionTimeoutMinutes} minutes`}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Security logs */}
      <section>
        <h2 className="mb-4 font-semibold">Recent security events (all users)</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{e.event}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.userEmail}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.device}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {e.channel}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={levelVariant[e.level] ?? "muted"}>
                      {e.level}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(e.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
