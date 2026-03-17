"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Heart, Leaf, ShieldCheck, Star, Truck, ShoppingCart } from "lucide-react"

import api from "../lib/api"
import { getImageUrl } from "../lib/media"
import { useCart } from "../lib/cartContext"
import JsonLd from "../components/JsonLd"
import ProductCard from "../components/ProductCard"
import SmartImage from "../components/SmartImage"
import TrustBadges from "../components/TrustBadges"

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

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center md:mb-10">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">{eyebrow}</p>}
      <h2 className="font-display mt-3 text-[28px] text-[var(--text-primary)] md:text-[32px]">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-2xl text-[18px] text-[var(--text-secondary)]">{subtitle}</p>}
    </div>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function HomePage() {
  const { add } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

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

  const heroImage = useMemo(() => {
    const bannerImage = isMobile ? heroBanner?.mobile_image ?? heroBanner?.image : heroBanner?.image
    const rawSrc =
      bannerImage ||
      products.find((p) => p.image)?.image ||
      null
    // Always pass through getImageUrl so relative paths like 'banners/x.jpg'
    // become absolute URLs and render correctly in production.
    return rawSrc ? getImageUrl(rawSrc) : null
  }, [heroBanner, isMobile, products])

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
    <div className="flex flex-col gap-6 pb-20 overflow-x-hidden">
      <JsonLd data={organizationSchema} />
      
      {/* 1. Hero Banner */}
      <section className="pt-8 md:pt-12 px-4">
        <div className="container-shell p-0">
          <div className="relative overflow-hidden rounded-[26px] border border-default bg-[var(--bg-surface)] shadow-soft">
            <div className="absolute inset-0">
              {heroImage ? (
                <SmartImage
                  src={heroImage}
                  alt={heroBanner?.title || "Malaika Nest collection"}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,rgba(139,76,46,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(212,168,83,0.18),transparent_55%),linear-gradient(135deg,rgba(32,28,24,0.10),rgba(32,28,24,0.04))]" />
              )}

              {/* Premium readability overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,14,10,0.66)_0%,rgba(18,14,10,0.44)_38%,rgba(18,14,10,0.08)_72%,rgba(18,14,10,0.00)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(255,255,255,0.16),transparent_60%)]" />
            </div>

            <div className="relative px-6 py-14 md:px-12 md:py-20 lg:px-16">
              <div className="max-w-[42rem]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Baby and Maternity</p>
                <h1 className="font-display mt-4 text-[38px] leading-[1.05] font-semibold text-white md:text-[54px] lg:text-[64px]">
                  {heroBanner?.title || "Carefully Chosen Essentials for Your Little One"}
                </h1>
                <p className="mt-5 max-w-2xl text-[16px] text-white/85 md:text-[18px]">
                  {heroBanner?.subtitle || "Shop clothing, nursery picks, baby essentials, toys, travel gear, and thoughtful gifts in one polished store experience."}
                </p>

                <div className="mt-9 flex w-full flex-col gap-3 sm:flex-row sm:w-auto">
                  <Link
                    href={heroBanner?.button_link || "/categories"}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    {heroBanner?.button_text || "Shop Collection"}
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/categories"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
                  >
                    Explore Categories
                  </Link>
                </div>

                <div className="mt-9 flex flex-wrap items-center gap-3 text-xs text-white/85">
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 backdrop-blur">Secure M-Pesa</span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 backdrop-blur">Fast Delivery</span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 backdrop-blur">Parent Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Grid */}
      <section className="py-10 px-4">
        <div className="container-shell p-0">
          <div className="mb-8 text-center md:mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Browse</p>
            <h2 className="font-display mt-3 text-[28px] text-[var(--text-primary)] md:text-[32px]">Shop by Category</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
            {[
              { name: "Baby", slug: "baby", icon: "👶", color: "from-rose-100 to-rose-50" },
              { name: "Kids", slug: "kids", icon: "👕", color: "from-blue-100 to-blue-50" },
              { name: "Toys", slug: "toys", icon: "🧸", color: "from-amber-100 to-amber-50" },
              { name: "Feeding", slug: "feeding", icon: "🍼", color: "from-emerald-100 to-emerald-50" },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories?category_path=${cat.slug}`}
                className="group relative overflow-hidden rounded-[16px] border border-default bg-gradient-to-br p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-hover"
              >
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl">{cat.icon}</span>
                  <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{cat.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Shop now</p>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/categories" className="text-sm font-semibold text-[var(--text-primary)] hover:underline">
              View All Categories →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="py-10 px-4">
        <div className="container-shell p-0">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-[28px] font-bold text-text-primary md:text-[34px]">Featured Products</h2>
            <Link href="/categories" className="text-sm font-semibold text-black hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {!loadingProducts &&
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        </div>
      </section>

      {/* 4. Popular Products (New Arrivals) */}
      <section className="py-10 px-4">
        <div className="container-shell p-0">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-[28px] font-bold text-text-primary md:text-[34px]">Popular Items</h2>
            <Link href="/categories" className="text-sm font-semibold text-black hover:underline">
              Browse More
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {!loadingProducts &&
              products.slice(0, 10).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        </div>
      </section>

      {/* 5. Customer Reviews */}
      <section className="py-12 px-4">
        <div className="container-shell p-0">
          <SectionHeading title="Customer Reviews" subtitle="Real experiences from families in our community." />

          {!loadingReviews && reviews.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((review) => (
                <article key={review.id} className="rounded-[18px] border border-default bg-white p-6 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-soft)] font-semibold text-text-primary">
                      {review.user_name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary">{review.user_name}</p>
                      <p className="text-xs text-text-secondary">{review.location || "Kenya"}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} size={14} className={idx < review.rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-text-secondary leading-relaxed">&quot;{review.comment}&quot;</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-default bg-[var(--bg-soft)] p-10 text-center shadow-soft">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white ring-1 ring-black/5">
                <Star size={26} className="text-[var(--gold)]" />
              </div>
              <p className="mt-5 text-[18px] text-text-primary">No reviews yet, be the first.</p>
              <p className="mt-2 text-sm text-text-secondary">Your feedback helps other parents shop with confidence.</p>
              <Link href="/categories" className="btn-primary mt-7 inline-flex items-center justify-center">
                Shop Now
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 6. CTA Banner */}
      <section className="px-4">
        <div className="container-shell p-0">
          <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] px-6 py-10 text-center md:px-12 md:py-14">
            <div className="relative z-10">
              <h2 className="font-display text-[28px] font-semibold text-white md:text-[36px]">
                Ready to Shop?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85 md:text-lg">
                Explore our full collection of premium baby and kids products. 
                Free delivery on orders over KES 3,000.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/categories"
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-white/90"
                >
                  Shop Now
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Trust Strip (Above Footer) */}
      <section className="pb-8">
        <TrustBadges />
      </section>
    </div>
  )
}
