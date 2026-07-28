'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '@/lib/api';

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  full_slug?: string;
  image?: string | null;
  product_count?: number;
  children?: ApiCategory[];
}

interface CategoriesContextValue {
  categories: ApiCategory[];
  loading: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue>({ categories: [], loading: true });

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/v1/products/categories/')
      .then((res) => {
        const data = res.data;
        const results: ApiCategory[] = data?.results ?? data?.data?.results ?? (Array.isArray(data) ? data : []);
        setCategories(results);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, loading }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}
