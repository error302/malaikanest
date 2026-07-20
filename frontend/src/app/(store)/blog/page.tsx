import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import { getPublishedPosts, getCategories } from '@/lib/blog';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Blog — Baby Care Tips, Parenting & Gift Guides',
  description: 'Expert advice on baby care, organic clothing, parenting tips, and gift guides from Malaika Nest. Handcrafted with love in Kenya.',
  alternates: { canonical: `${SITE_URL}/blog` },
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getPublishedPosts(), getCategories()]);

  return (
    <div className="container-shell py-6 sm:py-10 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          The Malaika Nest Blog
        </h1>
        <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
          Baby care tips, parenting advice, and gift guides — handcrafted with love in Kenya.
        </p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <Link href="/blog" className="text-xs px-4 py-1.5 min-h-[44px] flex items-center rounded-full font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>All</Link>
        {categories.map((cat) => (
          <Link key={cat} href={`/blog?category=${encodeURIComponent(cat)}`} className="text-xs px-4 py-1.5 min-h-[44px] flex items-center rounded-full font-medium border" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>{cat}</Link>
        ))}
      </div>

      {/* Featured post (first one) */}
      {posts.length > 0 && (
        <Link href={`/blog/${posts[0].slug}`} className="block mb-8 group">
          <div className="grid md:grid-cols-2 gap-5 rounded-2xl overflow-hidden border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            {posts[0].coverImage && (
              <div className="aspect-[16/10] md:aspect-auto overflow-hidden" style={{ background: 'var(--brand-warm)' }}>
                <img src={posts[0].coverImage} alt={posts[0].title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            )}
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(139,105,20,0.1)', color: 'var(--brand-gold)' }}>{posts[0].category}</span>
                {posts[0].publishedAt && (
                  <span className="text-[10px] inline-flex items-center gap-1" style={{ color: 'var(--brand-text-muted)' }}>
                    <Calendar size={10} /> {new Date(posts[0].publishedAt).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2 group-hover:text-[var(--brand-gold)] transition-colors" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
                {posts[0].title}
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--brand-text-secondary)' }}>{posts[0].excerpt}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--brand-gold)' }}>Read more <ArrowRight size={14} /></span>
            </div>
          </div>
        </Link>
      )}

      {/* Grid of remaining posts */}
      {posts.length > 1 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {posts.slice(1).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col rounded-2xl overflow-hidden border transition-all hover:shadow-warm-md" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
              {post.coverImage && (
                <div className="aspect-[16/10] overflow-hidden" style={{ background: 'var(--brand-warm)' }}>
                  <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              )}
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,105,20,0.1)', color: 'var(--brand-gold)' }}>{post.category}</span>
                </div>
                <h3 className="font-serif text-lg font-semibold mb-1.5 line-clamp-2 group-hover:text-[var(--brand-gold)] transition-colors" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
                  {post.title}
                </h3>
                <p className="text-xs leading-relaxed line-clamp-2 flex-1" style={{ color: 'var(--brand-text-secondary)' }}>{post.excerpt}</p>
                {post.publishedAt && (
                  <p className="text-[10px] mt-3 pt-3" style={{ color: 'var(--brand-text-muted)', borderTop: '1px solid var(--brand-border)' }}>
                    {new Date(post.publishedAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No blog posts yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
