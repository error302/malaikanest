"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, LogOut, Menu, Search, ShoppingBag, User, X } from "lucide-react"

import api from "../lib/api"
import { buildCategoryHref, CategoryNode, orderRootCategories } from "../lib/catalog"
import { useCart } from "../lib/cartContext"
import { useAuth } from "../lib/authContext"
import MiniCart from "./MiniCart"
import Logo from "./Logo"

const staticNav = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/categories" },
  { label: "Best Sellers", href: "/best-sellers" },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  const { items, remove, updateQty } = useCart()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  const cartCount = useMemo(() => items.reduce((sum, item) => sum + (item.qty || 1), 0), [items])
  const rootCategories = useMemo(() => orderRootCategories(categories), [categories])

  useEffect(() => {
    if (pathname.startsWith("/admin")) return
    setLoadingCategories(true)
    api
      .get("/api/products/categories/")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : res.data?.results || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))
  }, [pathname])

  useEffect(() => {
    setMobileOpen(false)
    setCartOpen(false)
    setSearchOpen(false)
    setShopOpen(false)
  }, [pathname])

  if (pathname.startsWith("/admin")) return null

  const runSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    router.push(`/categories?search=${encodeURIComponent(value)}`)
  }

  const categoryLinks = rootCategories.map((category) => ({
    label: category.name,
    href: buildCategoryHref(category),
    category,
  }))

  return (
    <header className="sticky top-0 z-50 border-b border-default bg-[var(--bg-primary)]/95 backdrop-blur">
      <div className="container-shell relative">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 xl:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)]">
          <div className="min-w-0">
            <Logo className="max-w-full" />
          </div>

          <nav className="hidden items-center justify-center gap-5 xl:flex" aria-label="Primary">
            {staticNav.slice(0, 2).map((item) => (
              item.label === "Shop" ? (
                <div
                  key={item.label}
                  className="relative flex h-full items-center"
                  onMouseEnter={() => setShopOpen(true)}
                  onMouseLeave={() => setShopOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setShopOpen((prev) => !prev)}
                    className="inline-flex min-h-0 items-center gap-1 text-[15px] font-medium leading-none text-[var(--text-primary)] transition-colors hover:text-[var(--link-hover)]"
                  >
                    {item.label}
                    <ChevronDown size={16} className={`transition-transform ${shopOpen ? "rotate-180" : ""}`} />
                  </button>
                  {shopOpen && (
                    <div className="absolute left-1/2 top-full z-50 w-[min(90vw,54rem)] -translate-x-1/2 pt-2">
                      <div className="grid gap-5 rounded-[16px] border border-default bg-surface p-5 shadow-[var(--shadow-hover)] md:grid-cols-3">
                        {loadingCategories ? (
                          <div className="md:col-span-3 rounded-[14px] border border-default bg-[var(--bg-primary)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                            Loading categories...
                          </div>
                        ) : rootCategories.length > 0 ? (
                          rootCategories.map((category) => (
                            <div key={category.id}>
                              <Link href={buildCategoryHref(category)} className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--link-hover)]">
                                {category.name}
                              </Link>
                              <div className="mt-3 space-y-2">
                                {category.children?.slice(0, 6).map((child) => (
                                  <Link
                                    key={child.id}
                                    href={buildCategoryHref(child)}
                                    className="block rounded-lg px-2 py-1 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-soft)] hover:text-[var(--text-primary)]"
                                  >
                                    {child.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="md:col-span-3 rounded-[14px] border border-default bg-[var(--bg-primary)] px-4 py-6 text-center">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">No categories found yet.</p>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">Add categories in Admin, or refresh the page.</p>
                            <Link href="/categories" className="btn-secondary mt-4 inline-flex px-6">
                              Browse All Products
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link key={item.label} href={item.href} className="text-[15px] font-medium leading-none text-[var(--text-primary)] transition-colors hover:text-[var(--link-hover)]">
                  {item.label}
                </Link>
              )
            ))}

            {staticNav.slice(2).map((item) => (
              <Link key={item.label} href={item.href} className="text-[15px] font-medium leading-none text-[var(--text-primary)] transition-colors hover:text-[var(--link-hover)]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-default bg-surface text-[var(--text-primary)]"
            >
              <Search size={18} />
            </button>
            <Link
              href={isAuthenticated ? "/account/orders" : "/login"}
              aria-label="Account"
              className="inline-flex items-center gap-3 rounded-xl border border-default bg-surface px-3 py-2 text-[var(--text-primary)]"
              title={isAuthenticated && user ? `Signed in as ${user.name}` : "Sign in"}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-soft)]">
                {isAuthenticated && user ? (
                  <span className="text-sm font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
                ) : (
                  <User size={18} />
                )}
              </span>
              <span className="hidden min-w-0 flex-col leading-tight sm:flex">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {isAuthenticated && user ? "Signed in" : "Account"}
                </span>
                <span className="max-w-[10rem] truncate text-xs text-[var(--text-secondary)]">
                  {isAuthenticated && user ? user.name : "Login / Register"}
                </span>
              </span>
            </Link>

            {isAuthenticated && (
              <button
                type="button"
                aria-label="Logout"
                onClick={async () => {
                  await logout()
                  router.push("/")
                  router.refresh()
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-default bg-surface text-[var(--text-primary)]"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                aria-label="Admin Dashboard"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-default bg-[var(--accent)] text-white"
                title="Admin Dashboard"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}

            <button
              type="button"
              aria-label="Cart"
              onClick={() => setCartOpen((prev) => !prev)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-default bg-surface text-[var(--text-primary)]"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--text-primary)] px-1 text-[11px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-default bg-surface text-[var(--text-primary)] xl:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4">
            <form onSubmit={runSearch} className="flex gap-2">
              <input
                className="input-soft"
                placeholder="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary px-6">Search</button>
            </form>
          </div>
        )}

        {mobileOpen && (
          <div className="mb-4 rounded-xl border border-default bg-surface p-4 xl:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile Primary">
              {[...staticNav.slice(0, 2), ...categoryLinks, ...staticNav.slice(2)].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-[15px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-soft)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-default pt-3">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Shop Highlights</p>
              <div className="space-y-2">
                {rootCategories.map((category) => (
                  <div key={category.id} className="rounded-xl border border-default bg-[var(--bg-primary)] p-3">
                    <Link href={buildCategoryHref(category)} className="font-semibold text-[var(--text-primary)]">
                      {category.name}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {category.children?.slice(0, 4).map((child) => (
                        <Link key={child.id} href={buildCategoryHref(child)} className="rounded-full border border-default px-3 py-2 text-sm text-[var(--text-primary)]">
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {cartOpen && (
          <div className="absolute right-0 top-[84px] z-50 w-[min(92vw,24rem)]">
            <MiniCart items={items} onRemove={remove} onUpdateQty={updateQty} />
          </div>
        )}
      </div>
    </header>
  )
}
