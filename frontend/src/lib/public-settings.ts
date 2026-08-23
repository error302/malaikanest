import { getApiBaseUrl } from '@/lib/site-config';

export interface PublicSettings {
  free_shipping_threshold: string;
  shipping_fee: string;
}

const FALLBACK: PublicSettings = {
  free_shipping_threshold: '3000',
  shipping_fee: '300',
};

let cache: { data: PublicSettings; ts: number } | null = null;
const TTL = 120_000;

export async function getPublicSettings(): Promise<PublicSettings> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${getApiBaseUrl()}/api/v1/core/settings/public/`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return FALLBACK;
    const data = await res.json();
    const result: PublicSettings = {
      free_shipping_threshold: data?.free_shipping_threshold ?? FALLBACK.free_shipping_threshold,
      shipping_fee: data?.shipping_fee ?? FALLBACK.shipping_fee,
    };
    cache = { data: result, ts: Date.now() };
    return result;
  } catch {
    return FALLBACK;
  }
}
