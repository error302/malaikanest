import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/admin/loyalty — list all loyalty accounts
 */

export async function GET() {
  try {
    const accounts = await db.loyaltyAccount.findMany({
      orderBy: { totalEarned: 'desc' },
      include: { _count: { select: { transactions: true } } },
    });
    return NextResponse.json({ accounts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, accounts: [] }, { status: 500 });
  }
}
