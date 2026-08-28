import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Server-side guard for admin-only API routes (/api/admin/*).
 *
 * Verification strategy (fail-closed):
 *   1. Look for the Django JWT refresh cookie (`refresh_token`, with legacy
 *      fallback to `refresh`). No cookie -> 401.
 *   2. Forward the caller's cookies to the backend's admin session-check
 *      endpoint, which cryptographically validates the refresh token,
 *      checks revocation/versioning AND confirms the account is an admin.
 *      A regular customer's refresh cookie can NOT pass - presence alone
 *      is never trusted.
 *   3. Positive results are cached briefly (keyed by a hash of the cookie,
 *      never the raw value) to avoid one backend round-trip per request.
 *
 * If the backend cannot be reached we fail CLOSED, because "open if the
 * verifier is down" would defeat the point of the gate.
 */

const VALIDATION_TTL_MS = 2 * 60 * 1000;
const VALIDATION_CACHE_MAX = 500;

const validationCache = new Map<string, { expiresAt: number }>();

function cacheKey(refreshCookie: string): string {
  return crypto.createHash('sha256').update(refreshCookie).digest('hex');
}

/** Resolve the internal API base the same way SSR fetches elsewhere do. */
function resolveBackendBase(): string {
  const env = process.env;
  // .trim() guards against stray whitespace in env config (e.g. `set X=v &&`
  // chains on Windows bake a trailing space into the value), which would
  // otherwise produce an invalid URL and fail the gate closed.
  if (env.INTERNAL_API_URL?.trim()) return env.INTERNAL_API_URL.trim();
  const publicUrl = env.NEXT_PUBLIC_API_URL?.trim();
  if (
    publicUrl &&
    (publicUrl.includes('localhost') || publicUrl.includes('127.0.0.1'))
  ) {
    return publicUrl;
  }
  if (process.env.NODE_ENV === 'development') return 'http://localhost:8000';
  return 'https://api.malaikanest.com';
}

export async function guardAdminRequest(
  req: NextRequest
): Promise<NextResponse | null> {
  const refreshCookie =
    req.cookies.get('refresh_token')?.value || req.cookies.get('refresh')?.value;

  if (!refreshCookie || refreshCookie.length < 20) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  const key = cacheKey(refreshCookie);
  const cached = validationCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return null; // validated recently
  }

  let verified = false;
  try {
    const base = resolveBackendBase();
    const resp = await fetch(`${base}/api/v1/accounts/admin/session-check/`, {
      method: 'POST',
      headers: {
        // Forward the incoming cookie header verbatim - the refresh token is
        // httponly, so this is the only way to hand it to Django without JS.
        Cookie: req.headers.get('cookie') ?? '',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });

    if (resp.ok) {
      const payload = await resp.json().catch(() => null);
      // Django wraps responses in a { status, data } envelope (custom renderer).
      const body = payload?.data ?? payload;
      verified = Boolean(body?.is_admin);
    }
    // 401/403 explicitly mean "not an admin" -> verified stays false.
  } catch {
    // Backend unreachable: fail closed below.
  }

  if (!verified) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  if (validationCache.size >= VALIDATION_CACHE_MAX) {
    validationCache.clear();
  }
  validationCache.set(key, { expiresAt: Date.now() + VALIDATION_TTL_MS });
  return null; // allowed
}

/**
 * Safely stringify the first level of an error for logging (never leak full
 * stack traces or internal paths to the client).
 */
export function sanitizeError(e: unknown): string {
  if (e instanceof Error)
    return e.message.replace(/\(.*?[\\/].*?\)/g, '(internal)').slice(0, 200);
  return String(e).slice(0, 200);
}
