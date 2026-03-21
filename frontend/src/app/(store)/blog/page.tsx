export const metadata = {
  title: 'Blog',
}

const articles = [
  {
    title: 'Choosing the right size for growing kids',
    excerpt: 'A quick guide to baby, toddler, and kids sizing so parents can shop with confidence.',
  },
  {
    title: 'Nursery essentials for the first year',
    excerpt: 'The practical products families reach for most during newborn and infant routines.',
  },
  {
    title: 'Travel checklist for parents on the move',
    excerpt: 'What to pack for safe, comfortable outings with babies and young children.',
  },
]

export default function BlogPage() {
  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Journal</p>
          <h1 className="font-display mt-2 text-[48px] text-[var(--text-primary)]">Parenting Tips & Store Updates</h1>
          <p className="mt-4 text-[18px] text-[var(--text-secondary)]">
            Helpful shopping guides, product roundups, and care tips for families raising little ones.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <article key={article.title} className="rounded-[12px] border border-default bg-surface p-6 shadow-[var(--shadow-soft)]">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Malaika Nest Blog</p>
              <h2 className="mt-3 text-[24px] font-semibold text-[var(--text-primary)]">{article.title}</h2>
              <p className="mt-3 text-[16px] text-[var(--text-secondary)]">{article.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
