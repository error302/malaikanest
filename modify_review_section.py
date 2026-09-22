with open('frontend/src/components/malaika/review-section.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '''            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <input required type="email" placeholder="Your email (not published)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
            </div>
            <input placeholder="Review title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
            <textarea required placeholder="Share your thoughts on this product…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />''',
    '''            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="review-name" className="sr-only">Your name</label>
                <input id="review-name" required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              </div>
              <div>
                <label htmlFor="review-email" className="sr-only">Your email (not published)</label>
                <input id="review-email" required type="email" placeholder="Your email (not published)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              </div>
            </div>
            <div>
              <label htmlFor="review-title" className="sr-only">Review title (optional)</label>
              <input id="review-title" placeholder="Review title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
            </div>
            <div>
              <label htmlFor="review-body" className="sr-only">Share your thoughts on this product…</label>
              <textarea id="review-body" required placeholder="Share your thoughts on this product…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
            </div>'''
)

with open('frontend/src/components/malaika/review-section.tsx', 'w') as f:
    f.write(content)
