export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type HomepageProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  currency: string;
  shortDesc?: string | null;
  image?: string;
  images: ProductImage[];
  rating: number;
  reviews: number;
  inStock: boolean;
  availableQuantity: number;
  allowOutOfStock: boolean;
  tags: string[];
};

export type ProductDetailReview = {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  createdAt: string;
};

export type ProductDetailData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  sku: string;
  price: number;
  comparePrice: number | null;
  currency: string;
  tags: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: ProductImage[];
  inventory: {
    quantity: number;
    reservedQuantity: number;
    lowStockThreshold: number;
  } | null;
  availableQuantity: number;
  allowOutOfStock: boolean;
  inStock: boolean;
  isLowStock: boolean;
  averageRating: number;
  reviewCount: number;
  reviews: ProductDetailReview[];
};


