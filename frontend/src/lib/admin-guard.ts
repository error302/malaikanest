import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight guard for admin-only API routes.
 * Checks for the presence of the admin refresh cookie set by Django on successful
 * admin login.  While not a cryptographic verification, it prevents casual/scripted
 * access by requiring a prior admin login in the same browser session.
 *
 * All /api/admin/* route handlers should call this as their first operation.
 */
export function guardAdminRequest(req: NextRequest): NextResponse | null {
  const refreshCookie = req.cookies.get('refresh')?.value;
  if (!refreshCookie || refreshCookie.length < 20) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }
  return null; // allowed
}

/**
 * Safely stringify the first level of an error for logging (never leak full
 * stack traces or internal paths to the client).
 */
export function sanitizeError(e: unknown): string {
  if (e instanceof Error) return e.message.replace(/\(.*?[\\/].*?\)/g, '(internal)').slice(0, 200);
  return String(e).slice(0, 200);
}