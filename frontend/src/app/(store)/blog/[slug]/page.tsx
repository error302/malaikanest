import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Calendar, Tag, ArrowLeft } from 'lucide-react';
import { getPostBySlug, getPublishedPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/site-config';
import DOMPurify from 'isomorphic-dompurify';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }] : [],
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

/** Build Article JSON-LD for SEO. */
function buildArticleJsonLd(post: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Malaika Nest',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Get related posts (same category, excluding current)
  const allPosts = await getPublishedPosts(10);
  const related = allPosts.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3);

  const jsonLd = buildArticleJsonLd(post);
  const tags = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div className="container-shell py-6 sm:py-10 max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs flex-wrap">
        <Link href="/" className="hover:text-[var(--brand-gold)]" style={{ color: 'var(--brand-text-muted)' }}>Home</Link>
        <ChevronRight size={12} style={{ color: 'var(--brand-text-muted)' }} />
        <Link href="/blog" className="hover:text-[var(--brand-gold)]" style={{ color: 'var(--brand-text-muted)' }}>Blog</Link>
        <ChevronRight size={12} style={{ color: 'var(--brand-text-muted)' }} />
        <span className="truncate max-w-[200px]" style={{ color: 'var(--brand-brown)' }}>{post.title}</span>
      </nav>

      <article>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(139,105,20,0.1)', color: 'var(--brand-gold)' }}>{post.category}</span>
            {post.publishedAt && (
              <span className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--brand-text-muted)' }}>
                <Calendar size={12} /> {new Date(post.publishedAt).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>· by {post.author}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)', lineHeight: 1.15 }}>
            {post.title}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>{post.excerpt}</p>
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8 relative" style={{ background: 'var(--brand-warm)' }}>
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content (rendered Markdown — basic) */}
        <div className="prose prose-sm max-w-none" style={{ color: 'var(--brand-text-secondary)' }}>
          {post.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) {
              return <h1 key={i} className="font-serif text-2xl font-semibold mt-6 mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>{line.slice(2)}</h1>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={i} className="font-serif text-xl font-semibold mt-5 mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>{line.slice(3)}</h2>;
            }
            if (line.startsWith('---')) {
              return <hr key={i} className="my-6" style={{ borderColor: 'var(--brand-border)' }} />;
            }
            if (line.startsWith('*') && line.endsWith('*')) {
              const html = line.slice(1, -1).replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: var(--brand-gold); text-decoration: underline;">$1</a>');
              return <p key={i} className="text-sm italic my-3" style={{ color: 'var(--brand-text-muted)' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
            }
            if (line.trim() === '') {
              return <div key={i} className="h-3" />;
            }
            // Parse links and bold
            const html = line
              .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: var(--brand-gold); text-decoration: underline;">$1</a>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            return <p key={i} className="text-sm leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
          })}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6" style={{ borderTop: '1px solid var(--brand-border)' }}>
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'var(--brand-warm)', color: 'var(--brand-brown)' }}>
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-12 pt-8" style={{ borderTop: '1px solid var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>More in {post.category}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((rp) => (
              <Link key={rp.id} href={`/blog/${rp.slug}`} className="group">
                <div className="aspect-[16/10] rounded-xl overflow-hidden mb-2" style={{ background: 'var(--brand-warm)' }}>
                  {rp.coverImage && <img src={rp.coverImage} alt={rp.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />}
                </div>
                <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-[var(--brand-gold)] transition-colors" style={{ color: 'var(--brand-text)' }}>{rp.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back to blog */}
      <div className="mt-10 text-center">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--brand-gold)' }}>
          <ArrowLeft size={14} /> Back to all posts
        </Link>
      </div>
    </div>
  );
}
