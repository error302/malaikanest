import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

/**
 * GET /api/admin/loyalty — list all loyalty accounts
 */

export async function GET(req: NextRequest) {
  const guard = guardAdminRequest(req);
  if (guard) return guard;
  try {
    const accounts = await db.loyaltyAccount.findMany({
      orderBy: { totalEarned: 'desc' },
      include: { _count: { select: { transactions: true } } },
    });
    return NextResponse.json({ accounts });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e), accounts: [] }, { status: 500 });
  }
}
