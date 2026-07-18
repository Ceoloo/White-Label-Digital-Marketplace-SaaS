import marketplaceConfig from "@/config/marketplace.config";
import type { PrivacyProviderConfig } from "@/config/types";

/**
 * Privacy Suite runtime.
 *
 * DESIGN INTENT (per project scope): the app does NOT bundle a VPN client or a
 * Tor binary, and it does NOT anonymize end-user browsing or bypass security
 * controls. Instead the operator points the app at an APPROVED egress they run
 * and are authorized to use (corporate VPN gateway, an authorized Tor/SOCKS
 * egress, or an HTTP forward proxy) via environment variables. The app can then
 * route its own *server-side outbound* requests through that egress for
 * compliance/privacy, and surfaces the configuration + status in a dashboard.
 */

const { privacy } = marketplaceConfig;

export interface ProviderStatus extends PrivacyProviderConfig {
  /** Enabled in config AND its endpoint env var is populated. */
  active: boolean;
  /** Endpoint present in the environment (value itself is never exposed). */
  configured: boolean;
}

/** Resolve every configured provider's live status from the environment. */
export function getProviderStatuses(): ProviderStatus[] {
  return privacy.providers.map((p) => {
    const configured = Boolean(process.env[p.envVar]);
    return { ...p, configured, active: p.enabled && configured };
  });
}

/** The single active egress provider, if any (first enabled + configured). */
export function getActiveEgress(): { provider: ProviderStatus; url: string } | null {
  if (!privacy.enabled) return null;
  const active = getProviderStatuses().find((p) => p.active);
  if (!active) return null;
  const url = process.env[active.envVar];
  return url ? { provider: active, url } : null;
}

/** High-level label for the dashboard: which channel outbound traffic uses. */
export function egressChannel(): "direct" | "vpn" | "tor" | "proxy" {
  const active = getActiveEgress();
  return active ? active.provider.kind : "direct";
}

export interface PrivacyStatus {
  enabled: boolean;
  channel: ReturnType<typeof egressChannel>;
  providers: ProviderStatus[];
  encryption: typeof privacy.encryption;
  compliance: typeof privacy.compliance;
  permissions: typeof privacy.permissions;
}

export function getPrivacyStatus(): PrivacyStatus {
  return {
    enabled: privacy.enabled,
    channel: egressChannel(),
    providers: getProviderStatuses(),
    encryption: privacy.encryption,
    compliance: privacy.compliance,
    permissions: privacy.permissions,
  };
}

let warnedNoDispatcher = false;

/**
 * Lazily load `undici` if the operator installed it. Kept as an optional,
 * non-bundled peer: the specifier is widened to `string` so the compiler and
 * bundler don't hard-resolve a module that may be absent.
 */
async function loadUndici(): Promise<{
  ProxyAgent: new (url: string) => unknown;
  fetch: (input: string | URL, init?: Record<string, unknown>) => Promise<Response>;
} | null> {
  try {
    const specifier: string = "undici";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(/* turbopackIgnore: true */ specifier);
    return mod?.ProxyAgent && mod?.fetch ? mod : null;
  } catch {
    return null;
  }
}

/**
 * Fetch that routes through the configured egress when one is active.
 *
 * Uses `undici`'s ProxyAgent for HTTP/HTTPS proxies when the package is present
 * (Node's global fetch doesn't expose a proxy option). For SOCKS/Tor endpoints
 * the operator must supply a SOCKS-capable dispatcher; until then this falls
 * back to a direct request and logs once, rather than silently failing. No
 * proxy dependency is bundled — this keeps egress a deployment choice.
 */
export async function outboundFetch(
  input: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const active = getActiveEgress();
  if (!active) return fetch(input, init);

  if (/^https?:\/\//i.test(active.url)) {
    const undici = await loadUndici();
    if (undici) {
      const dispatcher = new undici.ProxyAgent(active.url);
      return undici.fetch(input, {
        ...(init as Record<string, unknown>),
        dispatcher,
      });
    }
  }

  if (!warnedNoDispatcher) {
    warnedNoDispatcher = true;
    console.warn(
      `[privacy] egress "${active.provider.id}" is configured but no compatible ` +
        `dispatcher is available (install 'undici' for HTTP proxies or a SOCKS ` +
        `agent for Tor/SOCKS). Falling back to a direct request.`,
    );
  }
  return fetch(input, init);
}

/** Mask a sensitive value for display in the Sensitive Data Vault. */
export function maskSensitive(value: string, visible = 4): string {
  if (!value) return "";
  if (value.length <= visible) return "•".repeat(value.length);
  return "•".repeat(value.length - visible) + value.slice(-visible);
}
