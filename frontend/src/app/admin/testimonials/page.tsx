'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Star, Edit2, X, Check } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  product?: string | null;
  initials?: string | null;
  isActive: boolean;
  position: number;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchAll = () => {
    fetch('/api/admin/testimonials')
      .then((r) => r.json())
      .then((data) => setTestimonials(data.testimonials || []))
      .catch(() => showToast('Failed to load testimonials', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      setTestimonials((t) => t.filter((x) => x.id !== id));
      showToast('Testimonial deleted', 'success');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const toggleActive = async (t: Testimonial) => {
    try {
      await fetch(`/api/admin/testimonials/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      setTestimonials((arr) => arr.map((x) => (x.id === t.id ? { ...x, isActive: !x.isActive } : x)));
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const handleSave = async (data: Partial<Testimonial>) => {
    try {
      if (editing) {
        await fetch(`/api/admin/testimonials/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        showToast('Testimonial updated', 'success');
      } else {
        await fetch('/api/admin/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        showToast('Testimonial added', 'success');
      }
      setEditing(null);
      setShowForm(false);
      fetchAll();
    } catch {
      showToast('Failed to save', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Testimonials
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            {testimonials.length} review{testimonials.length === 1 ? '' : 's'} on the homepage
          </p>
        </div>
        <button type="button" onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
      ) : testimonials.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No testimonials yet. Add your first review.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {testimonials.map((t) => (
            <div key={t.id} className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', opacity: t.isActive ? 1 : 0.55 }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-gold-soft)' }}>
                    <span className="font-serif text-xs font-semibold" style={{ color: 'var(--brand-brown-dark)' }}>{t.initials || t.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{t.location}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => { setEditing(t); setShowForm(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--brand-warm)]" aria-label="Edit">
                    <Edit2 size={13} style={{ color: 'var(--brand-brown)' }} />
                  </button>
                  <button type="button" onClick={() => handleDelete(t.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--brand-warm)]" aria-label="Delete">
                    <Trash2 size={13} style={{ color: 'var(--brand-terra)' }} />
                  </button>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className={i < t.rating ? 'fill-current' : ''} style={{ color: i < t.rating ? 'var(--brand-gold)' : 'var(--brand-border)' }} />
                ))}
              </div>
              <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--brand-text-secondary)' }}>&ldquo;{t.text}&rdquo;</p>
              {t.product && <p className="text-[10px] mt-2 uppercase tracking-wider font-medium" style={{ color: 'var(--brand-gold)' }}>{t.product}</p>}
              <button type="button" onClick={() => toggleActive(t)} className="mt-3 text-xs px-2.5 py-1 rounded-full" style={{ background: t.isActive ? 'rgba(45,90,66,0.12)' : 'var(--brand-warm)', color: t.isActive ? 'var(--brand-green-light)' : 'var(--brand-text-muted)' }}>
                {t.isActive ? '● Active' : '○ Hidden'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <TestimonialForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function TestimonialForm({ initial, onSave, onClose }: { initial: Testimonial | null; onSave: (d: Partial<Testimonial>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    location: initial?.location || '',
    rating: initial?.rating || 5,
    text: initial?.text || '',
    product: initial?.product || '',
    initials: initial?.initials || '',
    position: initial?.position || 0,
  });

  const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
  const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(44,24,16,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-warm-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--brand-text)' }}>{initial ? 'Edit' : 'Add'} Testimonial</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--brand-warm)]"><X size={18} style={{ color: 'var(--brand-brown)' }} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} style={inputStyle} />
            <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} style={inputStyle} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} className={inputClass} style={inputStyle}>
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>)}
            </select>
            <input placeholder="Initials (e.g. AW)" value={form.initials} onChange={(e) => setForm({ ...form, initials: e.target.value })} className={inputClass} style={inputStyle} />
            <input type="number" placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })} className={inputClass} style={inputStyle} />
          </div>
          <textarea placeholder="Review text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4} className={inputClass} style={inputStyle} />
          <input placeholder="Product (optional)" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className={inputClass} style={inputStyle} />
        </div>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={() => onSave(form)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            <Check size={16} /> {initial ? 'Update' : 'Add'} Testimonial
          </button>
          <button type="button" onClick={onClose} className="rounded-full border px-5 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
