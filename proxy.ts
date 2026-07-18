import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Advertises the Tor hidden service via the `Onion-Location` HTTP header.
 *
 * Tor Browser reads this header and offers (or auto-redirects) the visitor the
 * .onion version of the page. This is the standard, spec'd mechanism for
 * supporting privacy-conscious users who bring their own Tor client — the app
 * does not run Tor or route anyone's traffic; it simply points Tor users at the
 * hidden service the operator runs.
 *
 * The address is read from the ONION_URL env var at request time (so it's
 * configurable without a rebuild) and validated as a Tor v3 onion. The header
 * is not sent when already browsing the .onion host.
 */
const ONION_V3 = /^[a-z2-7]{56}\.onion$/;

function onionHost(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .toLowerCase();
}

export function proxy(request: NextRequest) {
  const res = NextResponse.next();

  const configured = (process.env.ONION_URL || "").trim();
  if (!configured) return res;

  const host = onionHost(configured);
  if (!ONION_V3.test(host)) return res;

  const requestHost = (request.headers.get("host") || "").toLowerCase();
  if (requestHost.endsWith(".onion")) return res;

  const { pathname, search } = request.nextUrl;
  res.headers.set("Onion-Location", `http://${host}${pathname}${search}`);
  return res;
}

export const config = {
  // Run on page routes; skip Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
