import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Fingerprint,
  Globe,
  Laptop,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Vault,
  Wifi,
} from "lucide-react";
import marketplaceConfig from "@/config/marketplace.config";
import {
  getCurrentUser,
  getDeviceSessionsForEmail,
  getSecurityEventsForEmail,
} from "@/lib/data/store";
import { getOnionUrl, getPrivacyStatus, maskSensitive } from "@/lib/privacy";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Your connection, encryption, and account-security status.",
};

// Reflects live egress/env configuration, so render per request.
export const dynamic = "force-dynamic";

const channelLabel: Record<string, string> = {
  direct: "Direct (TLS)",
  vpn: "VPN egress",
  tor: "Tor / SOCKS egress",
  proxy: "HTTP proxy egress",
};

const levelVariant: Record<string, "muted" | "secondary" | "sale"> = {
  info: "muted",
  warning: "secondary",
  critical: "sale",
};

export default async function PrivacyDashboardPage() {
  if (!marketplaceConfig.features.privacy) notFound();

  const status = getPrivacyStatus();
  const onionUrl = getOnionUrl();
  const user = await getCurrentUser();
  const events = user ? await getSecurityEventsForEmail(user.email) : [];
  const devices = user ? await getDeviceSessionsForEmail(user.email) : [];

  const protectionOn = status.enabled && status.encryption.inTransit;

  return (
    <div className="container py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Privacy dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          A transparent view of how your connection and data are protected.
          Privacy and egress services are configured by the store operator to
          meet their compliance requirements.
        </p>
      </header>

      {/* Tor hidden service */}
      {onionUrl && (
        <div className="mb-8 flex flex-col gap-3 rounded-lg border bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Globe className="size-5" />
            </div>
            <div>
              <div className="font-semibold">Reach us privately over Tor</div>
              <p className="text-sm text-muted-foreground">
                Prefer to browse anonymously? Open our hidden service in Tor
                Browser. Your visit stays private end-to-end via the Tor network.
              </p>
            </div>
          </div>
          <code className="max-w-full shrink-0 truncate rounded-md border bg-background px-3 py-2 text-sm font-medium">
            {onionUrl.replace(/^https?:\/\//, "")}
          </code>
        </div>
      )}

      {/* Top status tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusTile
          icon={<ShieldCheck />}
          label="Connection protection"
          value={protectionOn ? "Active" : "Standard"}
          ok={protectionOn}
        />
        <StatusTile
          icon={<Wifi />}
          label="Traffic privacy"
          value={channelLabel[status.channel] ?? "Direct"}
          ok={status.channel !== "direct"}
          neutral={status.channel === "direct"}
        />
        <StatusTile
          icon={<Lock />}
          label="Encryption"
          value={
            status.encryption.atRest && status.encryption.inTransit
              ? "At rest + in transit"
              : status.encryption.inTransit
                ? "In transit"
                : "Off"
          }
          ok={status.encryption.inTransit}
        />
        <StatusTile
          icon={<Fingerprint />}
          label="Session policy"
          value={`${status.permissions.sessionTimeoutMinutes}m timeout`}
          ok
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {/* Security logs */}
          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight">
              Security logs
            </h2>
            <div className="divide-y rounded-lg border">
              {events.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No recent security events.
                </p>
              ) : (
                events.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-4">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        e.level === "critical"
                          ? "bg-destructive/10 text-destructive"
                          : e.level === "warning"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {e.level === "info" ? (
                        <ShieldCheck className="size-4" />
                      ) : (
                        <ShieldAlert className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{e.event}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.device} · {e.channel} · {formatDate(e.createdAt)}
                      </div>
                    </div>
                    <Badge variant={levelVariant[e.level] ?? "muted"}>
                      {e.level}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Device monitoring */}
          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight">
              Device monitoring
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {devices.map((d) => (
                <Card key={d.id}>
                  <CardContent className="flex items-start gap-3 p-5">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Laptop className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-medium">
                        {d.device}
                        {d.current && <Badge variant="success">This device</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {d.location} · active {formatDate(d.lastActive)}
                      </div>
                      <div className="mt-1 text-xs">
                        {d.trusted ? (
                          <span className="text-success">Trusted device</span>
                        ) : (
                          <span className="text-destructive">Unrecognized</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Right column: vault + permissions */}
        <aside className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Vault className="size-5 text-primary" />
                <h2 className="font-semibold">Sensitive data vault</h2>
              </div>
              <dl className="space-y-3 text-sm">
                <VaultRow label="Email" value={maskEmail(user?.email)} />
                <VaultRow
                  label="Phone"
                  value={user?.phone ? maskSensitive(user.phone, 2) : "Not on file"}
                />
                <VaultRow
                  label="Referral code"
                  value={user?.referralCode ?? "—"}
                />
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Stored encrypted and shown masked. Only you and authorized
                admins can reveal these values.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 font-semibold">Permission management</h2>
              <ul className="space-y-3 text-sm">
                <PermRow
                  label="Admin approval for sensitive changes"
                  on={status.permissions.requireAdminApproval}
                />
                <PermRow label="Encryption in transit (TLS)" on={status.encryption.inTransit} />
                <PermRow label="Encryption at rest" on={status.encryption.atRest} />
                <PermRow label="Audit logging" on={status.compliance.auditLogging} />
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Data region: {status.compliance.region} · Retention:{" "}
                {status.compliance.dataRetentionDays} days
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatusTile({
  icon,
  label,
  value,
  ok,
  neutral,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok?: boolean;
  neutral?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div
          className={cn(
            "mb-2 flex size-9 items-center justify-center rounded-full [&_svg]:size-4",
            neutral
              ? "bg-muted text-muted-foreground"
              : ok
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function VaultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function PermRow({ label, on }: { label: string; on: boolean }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <Badge variant={on ? "success" : "muted"}>{on ? "On" : "Off"}</Badge>
    </li>
  );
}

function maskEmail(email?: string): string {
  if (!email) return "—";
  const [name, domain] = email.split("@");
  if (!domain) return maskSensitive(email);
  const shown = name.slice(0, 1);
  return `${shown}${"•".repeat(Math.max(1, name.length - 1))}@${domain}`;
}
