import { getApiBaseUrl } from '@/lib/site-config';

export interface ShopPhoto {
  id: string;
  image: string;
  caption: string;
  position: number;
}

export async function getShopPhotos(): Promise<ShopPhoto[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${getApiBaseUrl()}/api/v1/core/shop-photos/`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];
    return results.filter((p: ShopPhoto) => p.image);
  } catch {
    return [];
  }
}
