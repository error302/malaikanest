import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * PUT /api/admin/loyalty/[email] — adjust points (add/remove)
 * Body: { points: number, reason: string }
 * Positive points = earn, negative = redeem/deduct
 */

const TIERS = [
  { name: 'bronze', min: 0 },
  { name: 'silver', min: 500 },
  { name: 'gold', min: 1500 },
];

function calculateTier(totalEarned: number): string {
  let tier = 'bronze';
  for (const t of TIERS) {
    if (totalEarned >= t.min) tier = t.name;
  }
  return tier;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email: rawEmail } = await params;
    const email = decodeURIComponent(rawEmail).toLowerCase();
    const body = await req.json();
    const points = parseInt(body.points) || 0;
    const reason = body.reason || 'Manual adjustment';

    if (points === 0) {
      return NextResponse.json({ error: 'Points must be non-zero' }, { status: 400 });
    }

    const account = await db.loyaltyAccount.findUnique({ where: { userEmail: email } });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const newBalance = Math.max(0, account.points + points);
    const newTotalEarned = points > 0 ? account.totalEarned + points : account.totalEarned;
    const newTotalRedeemed = points < 0 ? account.totalRedeemed + Math.abs(points) : account.totalRedeemed;
    const newTier = calculateTier(newTotalEarned);

    // Update account + create transaction in a single operation
    const [updated] = await Promise.all([
      db.loyaltyAccount.update({
        where: { userEmail: email },
        data: {
          points: newBalance,
          totalEarned: newTotalEarned,
          totalRedeemed: newTotalRedeemed,
          tier: newTier,
        },
      }),
      db.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: points > 0 ? 'earn' : 'redeem',
          points,
          reason,
        },
      }),
    ]);

    return NextResponse.json({ account: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
