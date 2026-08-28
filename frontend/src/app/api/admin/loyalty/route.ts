import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

/**
 * GET /api/admin/loyalty — list all loyalty accounts
 */

export async function GET(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const url = new URL(req.url);
    const take = Math.min(Math.max(parseInt(url.searchParams.get('take') || '50', 10) || 50, 1), 200);
    const skip = Math.max(parseInt(url.searchParams.get('skip') || '0', 10) || 0, 0);
    const [accounts, total] = await Promise.all([
      db.loyaltyAccount.findMany({
        orderBy: { totalEarned: 'desc' },
        include: { _count: { select: { transactions: true } } },
        take,
        skip,
      }),
      db.loyaltyAccount.count(),
    ]);
    return NextResponse.json({ accounts, total, hasMore: skip + take < total });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e), accounts: [] }, { status: 500 });
  }
}
