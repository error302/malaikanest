import { getApiBaseUrl } from '@/lib/site-config';

export interface DeliveryZone {
  slug: string;
  name: string;
  fee: string;
  estimated_days: string;
}

const FALLBACK_ZONES: DeliveryZone[] = [
  { slug: 'mombasa_pickup', name: 'Mombasa (Pick up at Shop)', fee: '0', estimated_days: 'Same Day' },
  { slug: 'mombasa', name: 'Mombasa (Delivery)', fee: '150', estimated_days: 'Same Day' },
  { slug: 'nairobi', name: 'Nairobi (1-2 Days)', fee: '300', estimated_days: '1-2 Days' },
  { slug: 'upcountry', name: 'Upcountry (2-3 Days)', fee: '500', estimated_days: '2-3 Days' },
];

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${getApiBaseUrl()}/api/v1/orders/delivery-zones/`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return FALLBACK_ZONES;
    const data = await res.json();
    const results = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];
    if (results.length > 0) return results;
    return FALLBACK_ZONES;
  } catch {
    return FALLBACK_ZONES;
  }
}
