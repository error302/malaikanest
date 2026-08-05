/**
 * Slugify a text string for URL use.
 * Lowercases, replaces non-alphanumeric runs with hyphens, trims edges.
 * Falls back to a default slug if the result is empty.
 */
export function slugify(text: string, fallback = 'item'): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback;
}