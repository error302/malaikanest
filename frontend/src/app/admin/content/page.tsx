'use client';

import { useEffect, useState } from 'react';
import { Save, Type, Layers } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Block {
  id: string;
  section: string;
  key: string;
  value: string;
  isActive: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Carousel',
  shop_by_age: 'Shop by Age',
  categories: 'Categories',
  featured: 'Featured Products',
  best_sellers: 'Best Sellers',
  new_arrivals: 'New Arrivals',
  testimonials: 'Testimonials Header',
  newsletter: 'Newsletter',
};

const KEY_LABELS: Record<string, string> = {
  label: 'Label (small tag)',
  title: 'Title',
  subtitle: 'Subtitle',
  view_all: 'View All button text',
  badge: 'Badge text',
  cta: 'Button text',
  placeholder: 'Input placeholder',
  disclaimer: 'Disclaimer',
  success_message: 'Success message',
  aggregate_rating: 'Aggregate rating text',
  slide1_tag: 'Slide 1 — Tag',
  slide1_headline: 'Slide 1 — Headline',
  slide1_highlight: 'Slide 1 — Highlight',
  slide1_sub: 'Slide 1 — Subtitle',
  slide1_cta: 'Slide 1 — Button',
  slide2_tag: 'Slide 2 — Tag',
  slide2_headline: 'Slide 2 — Headline',
  slide2_highlight: 'Slide 2 — Highlight',
  slide2_sub: 'Slide 2 — Subtitle',
  slide2_cta: 'Slide 2 — Button',
  slide3_tag: 'Slide 3 — Tag',
  slide3_headline: 'Slide 3 — Headline',
  slide3_highlight: 'Slide 3 — Highlight',
  slide3_sub: 'Slide 3 — Subtitle',
  slide3_cta: 'Slide 3 — Button',
};

export default function AdminContentPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState<string>('hero');

  useEffect(() => {
    fetch('/api/admin/content')
      .then((r) => r.json())
      .then((data) => setBlocks(data.blocks || []))
      .catch(() => showToast('Failed to load content', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const updateValue = (id: string, value: string) => {
    setBlocks((b) => b.map((blk) => (blk.id === id ? { ...blk, value } : blk)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = blocks.map((b) => ({ section: b.section, key: b.key, value: b.value, isActive: b.isActive }));
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      showToast('Content saved — homepage updated', 'success');
    } catch {
      showToast('Failed to save content', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sections = Array.from(new Set(blocks.map((b) => b.section)));
  const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
  const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Homepage Content
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          Edit the wording of every homepage section. Changes go live instantly.
        </p>
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          const sectionBlocks = blocks.filter((b) => b.section === section);
          const isOpen = openSection === section;
          return (
            <div key={section} className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? '' : section)}
                className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-[var(--brand-bg-alt)]"
              >
                <div className="flex items-center gap-2">
                  <Type size={16} style={{ color: 'var(--brand-gold)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>
                    {SECTION_LABELS[section] || section}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--brand-warm)', color: 'var(--brand-text-muted)' }}>
                    {sectionBlocks.length} fields
                  </span>
                </div>
                <span className="text-lg" style={{ color: 'var(--brand-text-muted)' }}>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="p-4 space-y-3" style={{ borderTop: '1px solid var(--brand-border)' }}>
                  {sectionBlocks.map((blk) => (
                    <div key={blk.id}>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>
                        {KEY_LABELS[blk.key] || blk.key}
                      </label>
                      {blk.value.length > 80 ? (
                        <textarea value={blk.value} onChange={(e) => updateValue(blk.id, e.target.value)} rows={2} className={inputClass} style={inputStyle} />
                      ) : (
                        <input value={blk.value} onChange={(e) => updateValue(blk.id, e.target.value)} className={inputClass} style={inputStyle} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
        <Save size={16} /> {saving ? 'Saving…' : 'Save All Content'}
      </button>
    </div>
  );
}
