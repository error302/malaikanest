export interface OrderItem {
  id: string;
  product: {
    id: number;
    name: string;
    slug: string;
    images?: Array<{ url: string; alt?: string }>;
  };
  variant: {
    id: string;
    color: string;
    color_label: string;
    size: string;
    size_label: string;
    sku: string;
  } | null;
  price: string;
  quantity: number;
}

export interface Order {
  id: number;
  receipt_number: string;
  status: string;
  subtotal: string;
  delivery_fee: string;
  discount_amount: string;
  total: string;
  created_at: string;
  items: OrderItem[];
  delivery_region: string;
  is_gift: boolean;
  gift_message?: string;
  mpesa_receipt_number?: string;
}
