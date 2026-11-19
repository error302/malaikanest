import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guardAdminRequest, sanitizeError, parsePagination } from '@/lib/admin-guard';

/**
 * GET /api/admin/loyalty — list all loyalty accounts
 */

export async function GET(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const { take, skip } = parsePagination(req);
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
