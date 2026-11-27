import type { Product, Variant } from "./api";

export function productForm(product: Partial<Product>) {
  return {
    name: product.name ?? "",
    slug: product.slug ?? "",
    price: product.price ?? "",
    stock: product.stock ?? 0,
    category: typeof product.category === "object" && product.category !== null ? product.category.id : product.category ?? "",
    image_url: product.image_url ?? "",
    description: product.description ?? "",
    fabric: product.fabric ?? "",
    whats_included: product.whats_included ?? "",
    size_guide: product.size_guide ?? "",
    size_label: product.size_label ?? "",
    age_group: product.age_group ?? "",
    age_range: product.age_range ?? "",
    gender: product.gender ?? "unisex",
    condition: product.condition ?? "new",
    compare_price: product.compare_price ?? "",
  };
}

export type ProductForm = ReturnType<typeof productForm>;
export type SaveIntent = "save" | "publish" | "draft";

export function productChanges(product: Partial<Product>, form: ProductForm, intent: SaveIntent = "save"): Partial<Product> {
  const previous = productForm(product);
  const changes: Record<string, unknown> = {};
  for (const key of Object.keys(form) as (keyof ProductForm)[]) {
    if (!product.id || form[key] !== previous[key]) changes[key] = form[key];
  }
  if (!product.id) {
    changes.slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    changes.status = "draft";
    changes.is_active = false;
  } else if (intent !== "save") {
    changes.status = intent === "publish" ? "published" : "draft";
    changes.is_active = intent === "publish";
  }
  return changes;
}

export function validateVariants(variants: Variant[], previous: Variant[] = []): string {
  const seen = new Set<string>();
  for (const [index, variant] of variants.entries()) {
    const label = `Size row ${index + 1}`;
    if (!variant.color) return `${label}: choose a colour.`;
    if (!Number.isInteger(variant.stock) || variant.stock < 0) return `${label}: stock must be a non-negative whole number.`;
    const original = previous.find((row) => row.id && row.id === variant.id);
    const reserved = original ? Math.max(0, original.stock - (original.available_stock ?? original.stock)) : 0;
    if (variant.stock < reserved) return `${label}: ${reserved} units are reserved; stock cannot be lower.`;
    const key = `${variant.size || ""}:${variant.color}`;
    if (seen.has(key)) return `${label}: duplicate size and colour. Reactivate or edit the existing row.`;
    seen.add(key);
  }
  return "";
}

export function availableVariantStock(variant: Variant, previous: Variant[]): number {
  const original = previous.find((row) => row.id && row.id === variant.id);
  const reserved = original ? Math.max(0, original.stock - (original.available_stock ?? original.stock)) : 0;
  return Math.max(0, variant.stock - reserved);
}

export function validatePhotos(files: Pick<File, "name" | "size" | "type">[]): string {
  for (const file of files) {
    if (!/\.(jpe?g|png|webp)$/i.test(file.name) || (file.type && !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      return `${file.name}: choose a JPG, PNG or WEBP image.`;
    }
    if (!file.size || file.size > 5 * 1024 * 1024) return `${file.name}: images must be non-empty and no larger than 5 MB.`;
  }
  return "";
}
