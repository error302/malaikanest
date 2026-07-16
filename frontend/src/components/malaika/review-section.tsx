'use client';

import { useEffect, useState } from 'react';
import { Star, Pencil, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';

interface Review {
  id: number;
  user_email?: string;
  user?: { email?: string; first_name?: string };
  rating: number;
  title?: string;
  body: string;
  created_at: string;
}

interface ReviewSectionProps {
  productSlug: string;
}

export function ReviewSection({ productSlug }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', body: '', name: '', email: '' });

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/api/v1/products/products/${productSlug}/reviews/`, {
        headers: { 'X-No-Auth-Redirect': 'true' },
      });
      const data = res.data;
      setReviews(data?.results ?? data?.data?.results ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get(`/api/v1/products/products/${productSlug}/reviews/`, {
          headers: { 'X-No-Auth-Redirect': 'true' },
        });
        if (cancelled) return;
        const data = res.data;
        setReviews(data?.results ?? data?.data?.results ?? []);
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [productSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/api/v1/products/products/${productSlug}/reviews/`, {
        rating: form.rating,
        title: form.title,
        body: form.body,
        user_email: form.email,
        name: form.name,
      });
      const newReview = res.data?.data ?? res.data;
      setReviews((r) => [newReview, ...r]);
      setShowForm(false);
      setForm({ rating: 5, title: '', body: '', name: '', email: '' });
      showToast('Review submitted! Thank you.', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-12 pt-8" style={{ borderTop: '1px solid var(--brand-border)' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold mb-1" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Customer Reviews
          </h2>
          {reviews.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(avgRating) ? 'fill-current' : ''} style={{ color: i < Math.round(avgRating) ? 'var(--brand-gold)' : 'var(--brand-border)' }} />
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                {avgRating.toFixed(1)} out of 5 · {reviews.length} review{reviews.length === 1 ? '' : 's'}
              </span>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>No reviews yet — be the first!</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
          style={{ borderColor: 'var(--brand-gold)', color: 'var(--brand-gold)' }}
        >
          <Pencil size={14} /> Write a Review
        </button>
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border mb-6" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} stars`}>
                    <Star size={24} className={n <= form.rating ? 'fill-current' : ''} style={{ color: n <= form.rating ? 'var(--brand-gold)' : 'var(--brand-border)' }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <input required type="email" placeholder="Your email (not published)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
            </div>
            <input placeholder="Review title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
            <textarea required placeholder="Share your thoughts on this product…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border px-5 py-2.5 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-8" style={{ color: 'var(--brand-text-muted)' }}>
          <Loader2 size={20} className="animate-spin mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 rounded-2xl border" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No reviews yet. Share your experience to help other parents!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-gold-soft)' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--brand-brown-dark)' }}>
                        {(review.user?.first_name?.[0] || review.user_email?.[0] || 'A').toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>
                      {review.user?.first_name || review.user_email?.split('@')[0] || 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'fill-current' : ''} style={{ color: i < review.rating ? 'var(--brand-gold)' : 'var(--brand-border)' }} />
                    ))}
                  </div>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--brand-text-muted)' }}>
                  {new Date(review.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {review.title && <p className="text-sm font-semibold mb-1" style={{ color: 'var(--brand-text)' }}>{review.title}</p>}
              <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
