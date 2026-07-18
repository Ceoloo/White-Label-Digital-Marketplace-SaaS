/**
 * Minimal admin authorization for mutating endpoints.
 *
 * The MVP has no full auth system yet. This is the seam to plug one in. When
 * `ADMIN_API_TOKEN` is set, admin write endpoints require a matching
 * `x-admin-token` header; when it's unset (local demo), writes are allowed so
 * the template runs with zero setup. Replace this with real session/role auth
 * before exposing the admin surface publicly.
 */
export function isAdminAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return true; // demo mode: no token configured
  const provided = req.headers.get("x-admin-token");
  return Boolean(provided) && provided === expected;
}

/** True when an admin token is required (i.e. configured) but was not provided. */
export function adminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_API_TOKEN);
}
