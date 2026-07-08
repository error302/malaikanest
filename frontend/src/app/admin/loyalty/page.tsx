'use client';

import { useEffect, useState } from 'react';
import { Award, Star, Plus, Minus, Search } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface LoyaltyAccount {
  id: string;
  userEmail: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: string;
  _count?: { transactions: number };
  updatedAt: string;
}

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

export default function AdminLoyaltyPage() {
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/loyalty');
        if (cancelled) return;
        const data = await res.json();
        setAccounts(data.accounts || []);
      } catch {
        if (!cancelled) setAccounts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleAdjust = async (email: string) => {
    const points = parseInt(adjustPoints);
    if (!points || points === 0) {
      showToast('Enter a non-zero point value', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/admin/loyalty/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason: adjustReason || 'Manual adjustment' }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAccounts((arr) => arr.map((a) => (a.userEmail === email ? { ...a, ...data.account } : a)));
      showToast(`${points > 0 ? 'Added' : 'Deducted'} ${Math.abs(points)} points`, 'success');
      setAdjusting(null);
      setAdjustPoints('');
      setAdjustReason('');
    } catch {
      showToast('Failed to adjust points', 'error');
    }
  };

  const filtered = accounts.filter((a) => !search || a.userEmail.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold flex items-center gap-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          <Award size={24} style={{ color: 'var(--brand-gold)' }} /> Loyalty Program
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          {accounts.length} member{accounts.length === 1 ? '' : 's'} · {accounts.filter((a) => a.tier === 'gold').length} gold · {accounts.filter((a) => a.tier === 'silver').length} silver · {accounts.filter((a) => a.tier === 'bronze').length} bronze
        </p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email…" className="input-warm w-full" style={{ background: '#FFFFFF' }} />
      </div>

      {loading ? (
        <div className="text-center py-20" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <Award size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No loyalty members yet. Customers earn points automatically when they create accounts and shop.</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--brand-bg-alt)' }}>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Customer</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Tier</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Points</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell" style={{ color: 'var(--brand-text)' }}>Lifetime Earned</th>
                  <th className="text-right p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => (
                  <tr key={account.id} style={{ borderTop: '1px solid var(--brand-border)' }}>
                    <td className="p-4">
                      <div className="font-medium truncate" style={{ color: 'var(--brand-text)' }}>{account.userEmail}</div>
                      <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{account._count?.transactions || 0} transactions</div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] px-2 py-1 rounded-full inline-flex items-center gap-1 font-semibold uppercase tracking-wider" style={{ background: `${TIER_COLORS[account.tier] || '#999'}20`, color: TIER_COLORS[account.tier] || '#999' }}>
                        <Star size={10} /> {account.tier}
                      </span>
                    </td>
                    <td className="p-4 font-semibold" style={{ color: 'var(--brand-gold)' }}>{account.points}</td>
                    <td className="p-4 hidden sm:table-cell" style={{ color: 'var(--brand-text-secondary)' }}>{account.totalEarned}</td>
                    <td className="p-4 text-right">
                      {adjusting === account.userEmail ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          <div className="flex gap-1">
                            <input type="number" value={adjustPoints} onChange={(e) => setAdjustPoints(e.target.value)} placeholder="±50" className="w-16 rounded-lg px-2 py-1 text-xs" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
                            <button type="button" onClick={() => handleAdjust(account.userEmail)} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>Save</button>
                            <button type="button" onClick={() => setAdjusting(null)} className="text-xs px-2 py-1 rounded-lg" style={{ color: 'var(--brand-text-muted)' }}>×</button>
                          </div>
                          <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Reason (optional)" className="w-40 rounded-lg px-2 py-1 text-xs" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
                        </div>
                      ) : (
                        <button type="button" onClick={() => setAdjusting(account.userEmail)} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'var(--brand-warm)', color: 'var(--brand-brown)' }}>
                          Adjust Points
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl border flex items-start gap-3" style={{ background: 'rgba(139,105,20,0.05)', borderColor: 'rgba(139,105,20,0.2)' }}>
        <Award size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-gold)' }} />
        <p className="text-xs" style={{ color: 'var(--brand-brown)' }}>
          <strong>How it works:</strong> Customers earn 1 point per KES 10 spent (Silver: 1.5x, Gold: 2x). 100 points = KES 50 discount at checkout. Tiers: Bronze (0+), Silver (500+), Gold (1500+). Use &quot;Adjust Points&quot; to manually add bonus points or deduct for returns.
        </p>
      </div>
    </div>
  );
}
