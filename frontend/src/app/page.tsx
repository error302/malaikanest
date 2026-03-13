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
    <div className="flex flex-col gap-6 pb-20 overflow-x-hidden">
      <JsonLd data={organizationSchema} />
      
      {/* 1. Hero Banner */}
      <section className="pt-10 md:pt-14 px-4">
        <div className="container-shell p-0">
          <div className="relative overflow-hidden rounded-[22px] border border-default bg-[var(--bg-surface)] shadow-soft">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(139,76,46,0.10),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(212,168,83,0.12),transparent_55%),radial-gradient(circle_at_60%_100%,rgba(139,76,46,0.06),transparent_55%)]" />
            <div className="relative grid items-center gap-8 p-6 md:grid-cols-2 lg:p-12">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">Baby and Maternity</p>
              <h1 className="font-display mt-4 text-[34px] leading-[1.06] font-semibold text-text-primary md:text-[46px] lg:text-[56px]">
                {heroBanner?.title || "Carefully Chosen Essentials for Your Little One"}
              </h1>
              <p className="mt-5 max-w-xl text-[16px] text-text-secondary md:text-[18px]">
                {heroBanner?.subtitle || "Shop clothing, nursery picks, baby essentials, toys, travel gear, and thoughtful gifts in one polished store experience."}
              </p>

              <div className="mt-8 flex flex-col w-full gap-3 sm:flex-row sm:w-auto">
                <Link
                  href={heroBanner?.button_link || "/categories"}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  {heroBanner?.button_text || "Shop Collection"}
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/categories"
                  className="btn-secondary inline-flex items-center justify-center"
                >
                  Explore Categories
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-text-secondary md:justify-start">
                <span className="rounded-full border border-default bg-[var(--bg-soft)] px-3 py-2">Secure M-Pesa</span>
                <span className="rounded-full border border-default bg-[var(--bg-soft)] px-3 py-2">Fast Delivery</span>
                <span className="rounded-full border border-default bg-[var(--bg-soft)] px-3 py-2">Parent Approved</span>
              </div>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] border border-default bg-bg-secondary">
              {heroImage ? (
                <>
                  <SmartImage
                  src={heroImage}
                  alt={heroBanner?.title || "Malaika Nest collection"}
                  fill
                  className="object-cover"
                  priority
                />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent-primary to-accent">
                  <p className="font-display text-[34px] font-semibold text-text-primary">Malaika Nest</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Strip */}
      <section className="py-6">
        <TrustBadges />
      </section>

      {/* 3. Categories */}
      <section className="py-10 px-4">
        <div className="container-shell p-0">
          <SectionHeading
            title="Shop by Category"
            subtitle="Explore our curated collections for every stage of your baby's growth."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {!loadingCategories &&
              rootCategories.map((category) => (
                <Link
                  key={category.id}
                  href={buildCategoryHref(category)}
                  className="group flex flex-col bg-white rounded-lg border border-default overflow-hidden transition-transform hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-bg-secondary">
                    {category.image ? (
                      <Image src={category.image} alt={category.name} fill className="object-cover transition-transform group-hover:scale-105" unoptimized={shouldUseUnoptimizedImage(category.image)} />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-accent-primary/20">
                        <span className="text-4xl font-bold text-text-primary">{category.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-text-primary">{category.name}</h3>
                    <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                      {category.description || "Beautiful and practical essentials for your little ones."}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-black">
                      Shop Now <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Products */}
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

      {/* 5. Popular Products (New Arrivals) */}
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

      {/* 6. Customer Reviews */}
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
    </div>
  )
}
