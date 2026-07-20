'use client';

import { useState } from 'react';
import { Save, Store, CreditCard, Truck } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'Malaika Nest',
    storeEmail: 'malaikanest7@gmail.com',
    storePhone: '+254726771321',
    mpesaTill: '3370347',
    freeShippingThreshold: '3000',
    mombasaFee: '0',
    nairobiFee: '300',
    upcountryFee: '500',
    lowStockThreshold: '5',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // In production, this would PATCH /api/v1/core/settings/
      await new Promise((r) => setTimeout(r, 800));
      showToast('Settings saved', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
  const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          Configure your store, payments and shipping
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Store size={18} style={{ color: 'var(--brand-gold)' }} />
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Store Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Store name</label>
              <input value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Contact email</label>
              <input value={settings.storeEmail} onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Contact phone</label>
              <input value={settings.storePhone} onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Low stock threshold</label>
              <input type="number" value={settings.lowStockThreshold} onChange={(e) => setSettings({ ...settings, lowStockThreshold: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} style={{ color: 'var(--brand-gold)' }} />
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Payments</h2>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>M-Pesa Till Number</label>
            <input value={settings.mpesaTill} onChange={(e) => setSettings({ ...settings, mpesaTill: e.target.value })} className={inputClass} style={inputStyle} />
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} style={{ color: 'var(--brand-gold)' }} />
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Shipping</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Free shipping over (KES)</label>
              <input type="number" value={settings.freeShippingThreshold} onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Mombasa fee (KES)</label>
              <input type="number" value={settings.mombasaFee} onChange={(e) => setSettings({ ...settings, mombasaFee: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Nairobi fee (KES)</label>
              <input type="number" value={settings.nairobiFee} onChange={(e) => setSettings({ ...settings, nairobiFee: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Upcountry fee (KES)</label>
              <input type="number" value={settings.upcountryFee} onChange={(e) => setSettings({ ...settings, upcountryFee: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          <Save size={16} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
