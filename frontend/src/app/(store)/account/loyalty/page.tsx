'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, TrendingUp, Gift, Star, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface LoyaltyAccount {
  id: string;
  userEmail: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: string;
  transactions: Array<{
    id: string;
    type: string;
    points: number;
    reason: string;
    createdAt: string;
  }>;
}

const TIER_INFO: Record<string, { label: string; color: string; perks: string[] }> = {
  bronze: { label: 'Bronze', color: '#CD7F32', perks: ['1 point per KES 10 spent', 'Birthday surprise gift'] },
  silver: { label: 'Silver', color: '#C0C0C0', perks: ['1.5 points per KES 10 spent', 'Free shipping on all orders', 'Early access to sales'] },
  gold: { label: 'Gold', color: '#FFD700', perks: ['2 points per KES 10 spent', 'Free shipping + priority dispatch', 'Exclusive mtumba first dibs', 'Monthly bonus points'] },
};

const POINTS_PER_KES = 10; // 1 point per KES 10
const KES_PER_100_POINTS = 50; // 100 points = KES 50

export default function LoyaltyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/loyalty?email=${encodeURIComponent(user.email!)}`);
        if (cancelled) return;
        const data = await res.json();
        setAccount(data.account || null);
      } catch {
        if (!cancelled) setAccount(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (isLoading || loading) {
    return <div className="container-shell py-20 text-center" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>;
  }

  if (!user) return null;

  const tier = account?.tier || 'bronze';
  const tierInfo = TIER_INFO[tier];
  const pointsValue = account ? Math.floor(account.points / 100) * KES_PER_100_POINTS : 0;
  const pointsToNextTier = tier === 'bronze' ? 500 - (account?.totalEarned || 0) : tier === 'silver' ? 1500 - (account?.totalEarned || 0) : 0;

  return (
    <div className="container-shell py-6 sm:py-10 max-w-3xl">
      <Link href="/account" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
        <ArrowLeft size={14} /> Back to account
      </Link>

      {/* Points balance card */}
      <div className="p-6 sm:p-8 rounded-2xl mb-6 text-white text-center" style={{ background: 'var(--brand-brown-dark)' }}>
        <Award size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-gold-soft)' }} />
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Your Points Balance</p>
        <p className="font-serif text-5xl font-semibold mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
          {account?.points || 0}
        </p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Worth KES {pointsValue.toLocaleString('en-KE')} at checkout
        </p>
        <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <Star size={12} style={{ color: tierInfo.color }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tierInfo.color }}>{tierInfo.label} Member</span>
        </div>
      </div>

      {/* Tier progress */}
      {tier !== 'gold' && (
        <div className="p-5 rounded-2xl border mb-6" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>
              Progress to {tier === 'bronze' ? 'Silver' : 'Gold'}
            </span>
            <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
              {pointsToNextTier > 0 ? `${pointsToNextTier} points to go` : 'Unlocked!'}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--brand-warm)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((account?.totalEarned || 0) / (tier === 'bronze' ? 500 : 1500)) * 100)}%`,
                background: 'var(--brand-gold)',
              }}
            />
          </div>
        </div>
      )}

      {/* Perks */}
      <div className="p-5 rounded-2xl border mb-6" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Gift size={18} style={{ color: 'var(--brand-gold)' }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Your {tierInfo.label} Perks</h2>
        </div>
        <ul className="space-y-2">
          {tierInfo.perks.map((perk) => (
            <li key={perk} className="text-sm flex items-center gap-2" style={{ color: 'var(--brand-text-secondary)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold)' }} />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      {/* How it works */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {[
          { Icon: TrendingUp, title: 'Earn', desc: `1 point per KES ${POINTS_PER_KES} spent` },
          { Icon: Gift, title: 'Redeem', desc: `100 points = KES ${KES_PER_100_POINTS} off` },
          { Icon: Star, title: 'Level Up', desc: '500 pts = Silver, 1500 pts = Gold' },
        ].map(({ Icon, title, desc }) => (
          <div key={title} className="p-4 rounded-2xl border text-center" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
            <Icon size={20} className="mx-auto mb-2" style={{ color: 'var(--brand-gold)' }} />
            <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{title}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      {account?.transactions && account.transactions.length > 0 && (
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Recent Activity</h2>
          <div className="space-y-2">
            {account.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--brand-text)' }}>{tx.reason || (tx.type === 'earn' ? 'Points earned' : 'Points redeemed')}</p>
                  <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                    {new Date(tx.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className="font-semibold" style={{ color: tx.points > 0 ? 'var(--brand-green-light)' : 'var(--brand-terra)' }}>
                  {tx.points > 0 ? '+' : ''}{tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
