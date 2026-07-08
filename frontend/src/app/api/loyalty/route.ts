import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/loyalty?email=user@example.com — get loyalty account + recent transactions
 * POST /api/loyalty — create account if not exists (called on first login/register)
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const account = await db.loyaltyAccount.findUnique({
      where: { userEmail: email.toLowerCase() },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!account) {
      return NextResponse.json({ account: null, message: 'No loyalty account yet' });
    }

    return NextResponse.json({ account });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const normalized = email.toLowerCase();
    const account = await db.loyaltyAccount.upsert({
      where: { userEmail: normalized },
      update: {},
      create: { userEmail: normalized },
    });

    return NextResponse.json({ account });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
