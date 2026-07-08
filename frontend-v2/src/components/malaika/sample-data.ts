import type { Product } from '@/components/malaika/product-card';

// Sample curated catalog reflecting Malaika Nest's premium Kenyan baby store positioning.
// In production these would come from the Django API at /api/v1/products/products/
export const FEATURED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Organic Cotton Newborn Onesie (3-Pack)',
    slug: 'organic-cotton-newborn-onesie-3pack',
    price: 1800,
    originalPrice: 2400,
    image:
      'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80&auto=format&fit=crop',
    category: 'Clothing',
    rating: 4.9,
    reviewCount: 124,
    badge: 'Bestseller',
    inStock: true,
  },
  {
    id: 2,
    name: 'Handcrafted Wooden Teething Ring',
    slug: 'wooden-teething-ring',
    price: 850,
    image:
      'https://images.unsplash.com/photo-15851576203894-4539fc2c37b6?w=600&q=80&auto=format&fit=crop',
    category: 'Toys & Learning',
    rating: 4.8,
    reviewCount: 67,
    inStock: true,
  },
  {
    id: 3,
    name: 'Swaddle Blanket Set — Terracotta',
    slug: 'swaddle-blanket-set-terracotta',
    price: 2200,
    originalPrice: 2800,
    image:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80&auto=format&fit=crop',
    category: 'Nursery',
    rating: 5.0,
    reviewCount: 38,
    badge: 'New',
    inStock: true,
  },
  {
    id: 4,
    name: 'Baby Carrier — Earth Brown',
    slug: 'baby-carrier-earth-brown',
    price: 6500,
    image:
      'https://images.unsplash.com/photo-1530041539828-114de669390e?w=600&q=80&auto=format&fit=crop',
    category: 'Travel & Safety',
    rating: 4.9,
    reviewCount: 89,
    inStock: true,
    hasVariants: true,
  },
];

export const BEST_SELLERS: Product[] = [
  {
    id: 5,
    name: 'Knitted Baby Booties (Pair)',
    slug: 'knitted-baby-booties',
    price: 650,
    image:
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80&auto=format&fit=crop',
    category: 'Clothing',
    rating: 4.7,
    reviewCount: 156,
    badge: 'Top Rated',
    inStock: true,
  },
  {
    id: 6,
    name: 'Organic Feeding Set (Bottle + Bibs)',
    slug: 'organic-feeding-set',
    price: 1950,
    originalPrice: 2400,
    image:
      'https://images.unsplash.com/photo-1555252586-d72e80a4adf6?w=600&q=80&auto=format&fit=crop',
    category: 'Baby Essentials',
    rating: 4.8,
    reviewCount: 92,
    inStock: true,
  },
  {
    id: 7,
    name: 'Soft Plush Elephant Toy',
    slug: 'plush-elephant-toy',
    price: 1200,
    image:
      'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=600&q=80&auto=format&fit=crop',
    category: 'Toys & Learning',
    rating: 4.9,
    reviewCount: 73,
    inStock: true,
  },
  {
    id: 8,
    name: 'Toddler Cotton Dress — Sage',
    slug: 'toddler-cotton-dress-sage',
    price: 1650,
    image:
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80&auto=format&fit=crop',
    category: 'Clothing',
    rating: 4.9,
    reviewCount: 41,
    badge: 'New',
    inStock: true,
    hasVariants: true,
  },
];

export const NEW_ARRIVALS: Product[] = [
  {
    id: 9,
    name: 'Bamboo Baby Sleeping Bag',
    slug: 'bamboo-sleeping-bag',
    price: 2800,
    image:
      'https://images.unsplash.com/photo-1607734834519-d8576ae60ea2?w=600&q=80&auto=format&fit=crop',
    category: 'Nursery',
    rating: 4.8,
    reviewCount: 22,
    badge: 'New',
    inStock: true,
  },
  {
    id: 10,
    name: 'Wooden Stacking Tower',
    slug: 'wooden-stacking-tower',
    price: 1450,
    image:
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&q=80&auto=format&fit=crop',
    category: 'Toys & Learning',
    rating: 5.0,
    reviewCount: 17,
    badge: 'New',
    inStock: true,
  },
  {
    id: 11,
    name: 'Cotton Romper — Cream Stripes',
    slug: 'cotton-romper-cream-stripes',
    price: 1350,
    originalPrice: 1700,
    image:
      'https://images.unsplash.com/photo-1547558348-5e83b15a4220?w=600&q=80&auto=format&fit=crop',
    category: 'Clothing',
    rating: 4.7,
    reviewCount: 29,
    inStock: true,
  },
  {
    id: 12,
    name: 'Newborn Gift Hamper — Deluxe',
    slug: 'newborn-gift-hamper-deluxe',
    price: 5500,
    image:
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80&auto=format&fit=crop',
    category: 'Gift Sets',
    rating: 5.0,
    reviewCount: 12,
    badge: 'Premium',
    inStock: true,
  },
];
