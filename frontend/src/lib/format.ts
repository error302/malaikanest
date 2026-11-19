/**
 * Format a number as Kenyan Shillings (KES).
 */
export function formatKES(n: number): string {
  if (!Number.isFinite(n)) return 'KES 0';
  return `KES ${n.toLocaleString('en-KE')}`;
}
