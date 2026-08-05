/**
 * Format a number as Kenyan Shillings (KES).
 */
export function formatKES(n: number): string {
  if (!Number.isFinite(n)) return 'KES 0';
  return `KES ${n.toLocaleString('en-KE')}`;
}

/**
 * Format a string or number from a raw API value.
 */
export function formatKESFromString(val: string | number | undefined | null): string {
  const n = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  return formatKES(Number.isFinite(n) ? n : 0);
}

/**
 * Format a date for Kenyan locale.
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', options ?? {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}