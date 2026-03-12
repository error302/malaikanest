"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Heart, Leaf, ShieldCheck, Star, Truck, ShoppingCart } from "lucide-react"

import api from "../lib/api"
import { getImageUrl, shouldUseUnoptimizedImage } from "../lib/media"
import { buildCategoryHref, CategoryNode, orderRootCategories } from "../lib/catalog"
import { useCart } from "../lib/cartContext"
import JsonLd from "../components/JsonLd"

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Malaika Nest",
  url: "https://malaikanest.duckdns.org",
  logo: "https://malaikanest.duckdns.org/logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "malaikanest7@gmail.com",
    telephone: "+254700000000",
  },
  sameAs: [
    "https://www.facebook.com/malaikanest",
    "https://www.instagram.com/malaikanest",
  ],
}

interface Product {
  id: number
  name: string
  slug: string
  price: string
  image: string | null
  category?: { name?: string; full_slug?: string }
  featured?: boolean
  stock?: number
}

interface Banner {
  id: number
  title: string
  subtitle: string
  button_text: string
  button_link: string
  image: string
  mobile_image?: string | null
}

interface Review {
  id: number
  user_name: string
  rating: number
  comment: string
  location?: string
}

const trustItems = [
  { title: "Safe Materials", subtitle: "Tested quality essentials", icon: Leaf },
  { title: "Fast Delivery", subtitle: "Reliable nationwide dispatch", icon: Truck },
  { title: "Parent Approved", subtitle: "Loved by Kenyan families", icon: CheckCircle2 },
  { title: "Secure Checkout", subtitle: "Protected payment flow", icon: ShieldCheck },
]

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center md:mb-10">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">{eyebrow}</p>}
      <h2 className="font-display mt-3 text-[28px] text-[var(--text-primary)] md:text-[32px]">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-2xl text-[18px] text-[var(--text-secondary)]">{subtitle}</p>}
    </div>
  )
}

export default function HomePage() {
  const { add } = useCart()

  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [bannerIndex, setBannerIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    api
      .get("/api/products/banners/")
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : res.data?.results || []
        setBanners(rows)
      })
      .catch(() => setBanners([]))

    api
      .get("/api/products/categories/")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : res.data?.results || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))

    api
      .get("/api/products/products/?ordering=-created_at")
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : res.data?.results || []
        setProducts(rows.slice(0, 8))
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))

    api
      .get("/api/products/reviews/?featured=true")
      .then((res) => setReviews(Array.isArray(res.data) ? res.data : res.data?.results || []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false))
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => setBannerIndex((prev) => (prev + 1) % banners.length), 6000)
    return () => clearInterval(timer)
  }, [banners.length])

  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia("(max-width: 768px)")

    const updateIsMobile = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches)
    }

    updateIsMobile(mediaQuery)
    mediaQuery.addEventListener("change", updateIsMobile)
    return () => mediaQuery.removeEventListener("change", updateIsMobile)
  }, [])

  const heroBanner = banners[bannerIndex]
  const rootCategories = useMemo(() => orderRootCategories(categories), [categories])

  const heroImage = useMemo(() => {
    const bannerImage = isMobile ? heroBanner?.mobile_image ?? heroBanner?.image : heroBanner?.image
    const rawSrc =
      bannerImage ||
      products.find((p) => p.image)?.image ||
      rootCategories.find((c) => c.image)?.image ||
      null
    // Always pass through getImageUrl so relative paths like 'banners/x.jpg'
    // become absolute URLs and render correctly in production.
    return rawSrc ? getImageUrl(rawSrc) : null
  }, [heroBanner, isMobile, products, rootCategories])

  const featuredProducts = useMemo(() => {
    const featured = products.filter((product) => Boolean(product.featured))
    const source = featured.length > 0 ? featured : products
    return source.slice(0, 8)
  }, [products])

  const addToCart = async (product: Product) => {
    if ((product.stock ?? 0) <= 0) return
    await add({ id: product.id, name: product.name, price: Number(product.price), image: product.image || "", qty: 1, slug: product.slug })
  }

  return (
    <div className="pb-20">
      <JsonLd data={organizationSchema} />
      <section className="pt-8 md:pt-12">
        <div className="container-shell">
          <div className="grid items-center gap-8 rounded-[12px] border border-default bg-surface p-5 shadow-[var(--shadow-soft)] md:grid-cols-2 md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Premium Baby & Kids Store</p>
              <h1 className="font-display mt-4 text-[30px] leading-[1.08] text-[var(--text-primary)] md:text-[38px]">
                {heroBanner?.title || "Carefully Chosen Essentials for Your Little One"}
              </h1>
              <p className="mt-4 max-w-xl text-[16px] text-[var(--text-secondary)] md:text-[17px]">
                {heroBanner?.subtitle || "Shop clothing, nursery picks, baby essentials, toys, travel gear, and thoughtful gifts in one polished store experience."}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={heroBanner?.button_link || "/categories"} className="btn-primary inline-flex items-center justify-center gap-2">
                  {heroBanner?.button_text || "Shop Collection"}
                  <ArrowRight size={16} />
                </Link>
                <Link href="/clothing" className="btn-secondary inline-flex items-center justify-center">
                  Browse Categories
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-[var(--accent-secondary)] blur-2xl" />
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-[var(--accent-primary)] blur-2xl" />

              <div className="relative overflow-hidden rounded-[12px] border border-default bg-[var(--bg-soft)]">
              {heroImage ? (
                <div className="relative aspect-[4/3] w-full sm:aspect-video md:aspect-[16/7] lg:aspect-[16/6]">
                  <Image
                    src={heroImage}
                    alt={heroBanner?.title || "Malaika Nest collection"}
                    fill
                    className="object-cover"
                    unoptimized={shouldUseUnoptimizedImage(heroImage)}
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[var(--accent-secondary)] via-[#f6efec] to-[var(--accent-primary)] sm:aspect-video md:aspect-[16/7] lg:aspect-[16/6]">
                  <p className="font-display text-[28px] text-[var(--text-primary)] md:text-[32px]">Malaika Nest</p>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-20">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Collections"
            title="Shop by Category"
            subtitle="A scalable storefront built around the six main shopping areas parents use most."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {loadingCategories &&
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-[12px] border border-default bg-surface p-5">
                  <div className="aspect-[4/3] rounded-[12px] bg-[var(--bg-soft)]" />
                  <div className="mt-4 h-5 w-1/2 rounded bg-[var(--bg-soft)]" />
                  <div className="mt-3 h-4 w-full rounded bg-[var(--bg-soft)]" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-[var(--bg-soft)]" />
                </div>
              ))}

            {!loadingCategories &&
              rootCategories.map((category) => (
                <Link
                  key={category.id}
                  href={buildCategoryHref(category)}
                  className="group flex h-full flex-col rounded-[12px] border border-default bg-surface p-5 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[var(--bg-soft)]">
                    {category.image ? (
                      <Image src={category.image} alt={category.name} fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized={shouldUseUnoptimizedImage(category.image)} />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)]">
                        <span className="font-display text-5xl text-[var(--text-primary)]">{category.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-[20px] font-semibold text-[var(--text-primary)]">{category.name}</h3>
                      <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-sm text-[var(--text-secondary)]">
                        {category.product_count || 0} products
                      </span>
                    </div>
                    <p className="mt-3 text-[16px] text-[var(--text-secondary)]">
                      {category.description || "Browse curated products in this collection."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {category.children?.slice(0, 5).map((child) => (
                        <span key={child.id} className="rounded-full border border-default px-3 py-2 text-sm text-[var(--text-primary)]">
                          {child.name}
                        </span>
                      ))}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      Explore {category.name}
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="pt-20">
        <div className="container-shell">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Fresh Picks</p>
              <h2 className="font-display mt-2 text-[30px] text-[var(--text-primary)] md:text-[34px]">New Arrivals</h2>
              <p className="mt-2 text-[18px] text-[var(--text-secondary)]">Latest additions from your product dashboard.</p>
            </div>
            <Link href="/categories" className="inline-flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {loadingProducts &&
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-[12px] border border-default bg-surface p-4">
                  <div className="aspect-square rounded-[12px] bg-[var(--bg-soft)]" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-[var(--bg-soft)]" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-[var(--bg-soft)]" />
                  <div className="mt-4 h-10 rounded bg-[var(--bg-soft)]" />
                </div>
              ))}

            {!loadingProducts &&
              featuredProducts.map((product) => {
                const inStock = (product.stock ?? 0) > 0
                return (
                  <article
                    key={product.id}
                    className="group rounded-[12px] border border-default bg-surface p-4 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]"
                  >
                    <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-[12px] bg-[var(--bg-soft)]">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized={shouldUseUnoptimizedImage(product.image)} />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)]">
                          <span className="font-display text-5xl text-[var(--text-primary)]">{product.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-default bg-surface text-[var(--text-primary)]">
                        <Heart size={15} />
                      </span>
                    </Link>

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">{product.category?.name || "Product"}</p>
                      <h3 className="mt-2 line-clamp-2 text-[18px] font-semibold text-[var(--text-primary)]">{product.name}</h3>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-lg font-semibold text-[var(--text-primary)]">KES {Number(product.price).toLocaleString()}</p>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={!inStock}
                          className={inStock ? "btn-primary px-4 flex items-center gap-2" : "btn-secondary cursor-not-allowed px-4 opacity-60 flex items-center gap-2"}
                        >
                          <ShoppingCart size={16} />
                          {inStock ? "Add to Cart" : "Out of Stock"}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
          </div>

          {!loadingProducts && featuredProducts.length === 0 && (
            <div className="rounded-[12px] border border-default bg-surface p-10 text-center text-[var(--text-secondary)]">
              No products yet. Add products from admin and they will appear here automatically.
            </div>
          )}
        </div>
      </section>

      <section className="pt-20">
        <div className="container-shell rounded-[12px] border border-default bg-surface p-6 md:p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-[12px] border border-default bg-[var(--bg-primary)] p-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-secondary)] text-[var(--text-primary)]">
                    <Icon size={20} />
                  </span>
                  <p className="mt-3 text-[20px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.subtitle}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="pt-20">
        <div className="container-shell">
          <SectionHeading eyebrow="Community" title="Customer Reviews" subtitle="Real feedback from families shopping with Malaika Nest." />

          {loadingReviews && (
            <div className="grid gap-8 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-44 animate-pulse rounded-[12px] border border-default bg-surface" />
              ))}
            </div>
          )}

          {!loadingReviews && reviews.length > 0 && (
            <div className="grid gap-8 md:grid-cols-3">
              {reviews.slice(0, 3).map((review) => (
                <article key={review.id} className="rounded-[12px] border border-default bg-surface p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-secondary)] font-semibold text-[var(--text-primary)]">
                      {review.user_name.charAt(0)}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{review.user_name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{review.location || "Kenya"}</p>
                    </div>
                    <div className="ml-auto flex">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} size={16} className={idx < review.rating ? "fill-[var(--star-filled)] text-[var(--star-filled)]" : "text-[var(--star-empty)]"} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-4 text-[16px] text-[var(--text-secondary)]">&quot;{review.comment}&quot;</p>
                </article>
              ))}
            </div>
          )}

          {!loadingReviews && reviews.length === 0 && (
            <div className="rounded-[12px] border border-default bg-surface p-10 text-center">
              <Star className="mx-auto text-[var(--star-filled)]" size={34} />
              <p className="mt-3 text-[18px] text-[var(--text-secondary)]">No reviews yet - be the first.</p>
              <Link href="/categories" className="btn-primary mt-5 inline-flex">Shop Now</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
