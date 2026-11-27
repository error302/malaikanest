/** API client: cookie-JWT session auth against the existing Django endpoints. */

const BASE = "/api";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function setAccessCookie(jwt: string | null) {
  // CookieJWTAuthentication reads `access_token` from cookies; the JWT lives
  // only for the access lifetime and is wiped on logout.
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  if (jwt) {
    document.cookie = `access_token=${jwt}; path=/; SameSite=Lax${secure}`;
  } else {
    document.cookie = `access_token=; path=/; Max-Age=0${secure}`;
  }
}

let refreshPending: Promise<boolean> | null = null;
function refreshAccess(): Promise<boolean> {
  if (!refreshPending) refreshPending = performRefresh().finally(() => { refreshPending = null; });
  return refreshPending;
}
async function performRefresh(): Promise<boolean> {
  try {
    const csrf = getCsrfToken();
    const res = await fetch(BASE + "/accounts/token/refresh/", {
      method: "POST",
      credentials: "same-origin",
      headers: csrf ? { "X-CSRFToken": csrf } : undefined,
      signal: AbortSignal.timeout(25000),
    });
    if (res.status >= 500) throw new ApiError("Session check unavailable. Please retry.", res.status);
    if (!res.ok) return false;
    const body = (await res.json()) as { access?: string; data?: { access?: string } };
    const data = body.data ?? body;
    if (!data.access) return false;
    setAccessCookie(data.access);
    return true;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Cannot refresh the session. Check your connection and retry.", 0);
  }
}

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const csrf = getCsrfToken();
  const method = (init?.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (init?.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (csrf && !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    headers["X-CSRFToken"] = csrf;
  }

  const hasHeaders = Object.keys(headers).length > 0;

  let res: Response;
  try {
  res = await fetch(BASE + path, {
    credentials: "same-origin",
    ...init,
    headers: hasHeaders ? headers : undefined,
    signal: init?.signal ?? AbortSignal.timeout(25000),
  });
  } catch {
    throw new ApiError(method === "GET" ? "Cannot reach the store. Check your connection and retry." : "Connection interrupted. The change may have reached the store. Check the saved record before retrying.", 0);
  }
  if (res.status === 401 && !retried && !["/accounts/admin/login/", "/accounts/token/refresh/"].includes(path)) {
    if (await refreshAccess()) return request<T>(path, init, true);
    throw new ApiError("Session expired — sign in again", 401);
  }
  if (res.status === 401) throw new ApiError("Not authenticated", 401);
  if (res.status === 204) return undefined as T;
  // DRF responses use the standard envelope {status, data} / {status:"error", error:{message}}.
  const body = await res.json().catch(() => {
    throw new ApiError(`Unexpected server response (${res.status}). Please retry.`, res.status);
  });
  if (!res.ok || body.status === "error") {
    const details = body?.error?.details;
    const message = details && typeof details === "object"
      ? Object.entries(details).map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(" ") : String(messages)}`).join(" ")
      : "";
    throw new ApiError(message || body?.error?.message || body?.detail || `Request failed (${res.status})`, res.status);
  }
  return (body.data ?? body) as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type PaymentState = "pending" | "confirmed" | "failed" | "cancelled" | "unreconciled";

export interface MpesaTransaction {
  id: string;
  order: string;
  order_status: string;
  amount: string;
  status: "initiated" | "completed" | "failed" | "cancelled";
  issue: string;
  receipt: string | null;
  reported_receipt: string | null;
  checkout_id: string | null;
  destination: string;
  initiated_at: string;
  confirmed_at: string | null;
  statement_verified_at: string | null;
}

export interface MpesaPayments {
  counts: Record<PaymentState, number>;
  has_next: boolean;
  transactions: MpesaTransaction[];
}

export const api = {
  mpesaPayments: (state: PaymentState, page: number, signal: AbortSignal) =>
    request<MpesaPayments>(`/payments/admin/mpesa/?state=${state}&page=${page}`, { signal }),
  login: async (email: string, password: string) => {
    const data = await request<{ access?: string; user?: { email: string } }>(
      "/accounts/admin/login/",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    if (data.access) setAccessCookie(data.access);
    return data;
  },
  session: () => request<{ is_staff: boolean; email: string; role: string }>("/accounts/admin/session/"),
  logout: async () => {
    await request<{ detail?: string }>("/accounts/logout/", { method: "POST" });
    setAccessCookie(null);
  },
  analytics: (days = "30") => request<Analytics>(`/orders/admin/analytics/?payment_days=${encodeURIComponent(days)}`),
  products: async (params: string) => asPaged<Product>(await request<unknown>(`/products/admin/products/${params}`)),
  catalogueOptions: () => request<CatalogueOptions>("/products/admin/products/catalogue-options/"),
  product: (id: string) => request<Product>(`/products/admin/products/${id}/`),
  saveProduct: (id: string | null, body: Partial<Product>) =>
    request<Product>(
      id ? `/products/admin/products/${id}/` : "/products/admin/products/",
      { method: id ? "PATCH" : "POST", body: JSON.stringify(body) }
    ),
  /** Multipart save for photo changes: the backend reads image/gallery_images
   * (FILES) plus delete_image_ids / primary_image_id from request.data. */
  saveProductMultipart: (id: string | null, fields: Partial<Product>, files: { key: string; file: File }[]) => {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        fd.append(key, typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? ""));
      }
    }
    for (const { key, file } of files) fd.append(key, file);
    return request<Product>(id ? `/products/admin/products/${id}/` : "/products/admin/products/", {
      method: id ? "PATCH" : "POST",
      body: fd,
    });
  },
  deleteProductImage: (productId: string, imageId: string) =>
    request<Product>(`/products/admin/products/${productId}/`, {
      method: "PATCH",
      body: JSON.stringify({ delete_image_ids: [imageId] }),
    }),
  deleteProduct: (id: string) =>
    request<void>(`/products/admin/products/${id}/`, { method: "DELETE" }),
  setPrimaryImage: (productId: string, imageId: string) =>
    request<Product>(`/products/admin/products/${productId}/`, {
      method: "PATCH",
      body: JSON.stringify({ primary_image_id: imageId }),
    }),
  productVariants: (id: string) =>
    request<{ variants?: Variant[]; images?: ProductImage[]; image?: string | null; image_full_url?: string | null }>(
      `/products/admin/products/${id}/`
    ),
  categories: () => request<Category[]>("/products/admin/categories/"),
  saveCategory: (id: string | null, body: Partial<Category>) =>
    request<Category>(
      id ? `/products/admin/categories/${id}/` : "/products/admin/categories/",
      { method: id ? "PATCH" : "POST", body: JSON.stringify(body) }
    ),
  saveCategoryMultipart: (id: string | null, fields: Record<string, string>, file: File) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    fd.append("image", file);
    return request<Category>(id ? `/products/admin/categories/${id}/` : "/products/admin/categories/", {
      method: id ? "PATCH" : "POST",
      body: fd,
    });
  },
  deleteCategory: (id: string) =>
    request<void>(`/products/admin/categories/${id}/`, { method: "DELETE" }),
  banners: () => request<Banner[]>("/products/admin/banners/"),
  saveBanner: (id: string | null, body: Partial<Banner>) =>
    request<Banner>(
      id ? `/products/admin/banners/${id}/` : "/products/admin/banners/",
      { method: id ? "PATCH" : "POST", body: JSON.stringify(body) }
    ),
  saveBannerMultipart: (id: string | null, fields: Record<string, string>, image?: File, mobileImage?: File) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    if (image) fd.append("image", image);
    if (mobileImage) fd.append("mobile_image", mobileImage);
    return request<Banner>(id ? `/products/admin/banners/${id}/` : "/products/admin/banners/", {
      method: id ? "PATCH" : "POST",
      body: fd,
    });
  },
  deleteBanner: (id: string) =>
    request<void>(`/products/admin/banners/${id}/`, { method: "DELETE" }),
  settings: () => request<SiteSettings>("/core/settings/"),
  saveSettings: (body: Partial<SiteSettings>) =>
    request<SiteSettings>("/core/settings/", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  saveSettingsMultipart: (fields: Record<string, string>, logoFile?: File) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    if (logoFile) fd.append("logo", logoFile);
    return request<SiteSettings>("/core/settings/", {
      method: "PATCH",
      body: fd,
    });
  },
  orders: async (params: string) =>
    asPaged<Order>(await request<unknown>(`/products/admin/orders/${params}`)),
  updateOrderStatus: (id: string, orderStatus: string) =>
    request<Order>(`/products/admin/orders/${id}/update_status/`, {
      method: "PATCH",
      body: JSON.stringify({ status: orderStatus }),
    }),
};

export interface Analytics {
  payments?: {
    received: string;
    by_method: { method: string; amount: string; count: number }[];
    awaiting_payment: number;
    to_dispatch: number;
  };
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  total_users: number;
  total_products: number;
  monthly: { month: string | null; revenue: number; orders: number }[];
  low_stock: { product: string; available: number; quantity: number }[];
  recent_orders: {
    id: number;
    order_number: string;
    customer_name: string;
    customer_email: string;
    total: string;
    status: string;
    created_at: string;
  }[];
}

export interface Paged<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Normalize every paginated shape into {count, results}. */
export function asPaged<T>(raw: unknown): Paged<T> {
  const d = (raw ?? {}) as Record<string, unknown>;
  const results = (d.results ?? d) as T[];
  return {
    count: Number(d.count ?? (Array.isArray(results) ? results.length : 0)),
    next: (d.next as string | null) ?? null,
    previous: (d.previous as string | null) ?? null,
    results: Array.isArray(results) ? results : [],
  };
}

/** Choice lists mirrored from Product.SIZE_CHOICES / ProductVariant.COLOR_CHOICES. */
export const SIZE_CHOICES: { value: string; label: string }[] = [
  { value: "newborn", label: "Newborn" },
  { value: "0-3m", label: "0-3M" },
  { value: "3-6m", label: "3-6M" },
  { value: "6-12m", label: "6-12M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "3y", label: "3Y" },
  { value: "4y", label: "4Y" },
  { value: "5y", label: "5Y" },
  { value: "6y", label: "6Y" },
  { value: "7y", label: "7Y" },
  { value: "8y", label: "8Y" },
  { value: "9y", label: "9Y" },
  { value: "10y", label: "10Y" },
  { value: "11y", label: "11Y" },
  { value: "12y", label: "12Y" },
  { value: "one-size", label: "One Size" },
];

export const COLOR_CHOICES: { value: string; label: string }[] = [
  "white", "black", "gray", "pink", "blue", "green", "yellow", "red",
  "purple", "orange", "brown", "beige", "multi",
].map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }));

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
}

export interface Variant {
  id?: string;
  color: string | null;
  size?: string | null;
  sku?: string | null;
  price_modifier?: string;
  stock: number;
  available_stock?: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  compare_price?: string | null;
  stock: number;
  available_stock?: number;
  reserved_stock?: number;
  is_active: boolean;
  featured?: boolean;
  category?: { id: string; name: string; slug: string } | string | null;
  image?: string | null;
  image_url?: string | null;
  image_full_url?: string | null;
  images?: ProductImage[];
  description?: string;
  fabric?: string;
  whats_included?: string;
  size_guide?: string;
  size_label?: string;
  age_group?: string;
  age_range?: string;
  gender?: string;
  condition?: string;
  status?: "draft" | "published";
  category_name?: string;
  variants?: Variant[];
  [key: string]: unknown;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: { id: string; name: string } | string | null;
  full_slug?: string;
  path_label?: string;
  is_storefront_root?: boolean;
  product_count?: number;
  description?: string;
  group?: string;
  image?: string | null;
  image_url?: string | null;
  image_full_url?: string | null;
  level?: number;
}

export interface CatalogueOption {
  value: string;
  label: string;
}

export interface CatalogueOptions {
  ages: CatalogueOption[];
  sizes: CatalogueOption[];
  age_ranges: CatalogueOption[];
  conditions: CatalogueOption[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string | null;
  image?: string | null;
  image_url?: string | null;
  image_full_url?: string | null;
  mobile_image?: string | null;
  mobile_image_url?: string | null;
  mobile_image_full_url?: string | null;
  is_active: boolean;
  position: number;
  created_at?: string;
}

export interface SiteSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  shipping_fee: string;
  free_shipping_threshold: string;
  minimum_order_amount: string;
  logo?: string | null;
  logo_url?: string | null;
  logo_full_url?: string | null;
  updated_at?: string;
}

export type OrderStatus =
  | "pending"
  | "initiated"
  | "paid"
  | "payment_failed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "processing"
  | "shipped"
  | "delivered";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  initiated: "Initiated",
  paid: "Paid",
  payment_failed: "Payment failed",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

/** Allowed next statuses per the backend state machine (Order.STATUS_TRANSITIONS). */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["initiated", "paid", "cancelled"],
  initiated: ["paid", "payment_failed", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  payment_failed: ["pending", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
  failed: [],
};

export interface OrderItem {
  id: number;
  product?: { name?: string } | null;
  variant?: Record<string, unknown> | null;
  price: string;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  user_email?: string;
  guest_email?: string | null;
  guest_phone?: string | null;
  shipping_phone?: string;
  total: string;
  status: OrderStatus;
  payment_status: string;
  mpesa_receipt_number?: string | null;
  delivery_region?: string | null;
  items: OrderItem[];
  created_at: string;
}
