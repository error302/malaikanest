export interface ApiCategory {
  id: string | number;
  name: string;
  slug: string;
  full_slug?: string;
  parent?: string | number | null;
  description?: string;
  group?: string;
  image?: string | null;
  children?: ApiCategory[];
  product_count?: number;
  level?: number;
}

export interface CategoryForm {
  name: string;
  group: string;
  description: string;
  parent: string;
}
