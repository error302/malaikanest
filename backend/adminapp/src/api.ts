/** API client: cookie-JWT session auth against the existing Django endpoints. */

const BASE = "/api";

function setAccessCookie(jwt: string | null) {
  // CookieJWTAuthentication reads `access_token` from cookies; the JWT lives
  // only for the access lifetime and is wiped on logout.
  if (jwt) {
    document.cookie = `access_token=${jwt}; path=/; SameSite=Lax`;
  } else {
    document.cookie = "access_token=; path=/; Max-Age=0";
  }
}

async function refreshAccess(): Promise<boolean> {
  try {
    const res = await fetch(BASE + "/accounts/token/refresh/", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access?: string };
    if (!data.access) return false;
    setAccessCookie(data.access);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: "same-origin",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  if (res.status === 401 && !retried && !path.startsWith("/accounts/")) {
    if (await refreshAccess()) return request<T>(path, init, true);
    throw new ApiError("Session expired — sign in again", 401);
  }
  if (res.status === 401) throw new ApiError("Not authenticated", 401);
  if (res.status === 204) return undefined as T;
  // DRF responses use the standard envelope {status, data} / {status:"error", error:{message}}.
  const body = await res.json();
  if (!res.ok || body.status === "error") {
    throw new ApiError(body?.error?.message ?? `Request failed (${res.status})`, res.status);
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

export const api = {
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
    try {
      await request<{ detail?: string }>("/accounts/logout/", { method: "POST" });
    } finally {
      setAccessCookie(null);
    }
  },
  analytics: () => request<Analytics>("/orders/admin/analytics/"),
  products: async (params: string) => asPaged<Product>(await request<unknown>(`/products/admin/products/${params}`)),
  product: (id: string) => request<Product>(`/products/admin/products/${id}/`),
  saveProduct: (id: string | null, body: Partial<Product>) =>
    request<Product>(
      id ? `/products/admin/products/${id}/` : "/products/admin/products/",
      { method: id ? "PATCH" : "POST", body: JSON.stringify(body) }
    ),
  productVariants: (id: string) =>
    request<{ variants?: Variant[] }>(`/products/admin/products/${id}/`),
  categories: () => request<Category[]>("/products/admin/categories/"),
  orders: async (params: string) =>
    asPaged<Order>(await request<unknown>(`/products/admin/orders/${params}`)),
  updateOrderStatus: (id: string, orderStatus: string) =>
    request<Order>(`/products/admin/orders/${id}/update_status/`, {
      method: "PATCH",
      body: JSON.stringify({ status: orderStatus }),
    }),
};

export interface Analytics {
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

export interface Variant {
  id?: string;
  color: string;
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
  is_active: boolean;
  featured?: boolean;
  category?: { id: string; name: string; slug: string } | string | null;
  image?: string | null;
  size_guide?: string;
  variants?: Variant[];
  [key: string]: unknown;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: { id: string; name: string } | null;
  product_count?: number;
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
