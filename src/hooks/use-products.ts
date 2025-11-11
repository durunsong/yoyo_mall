/**
 * 商品相关的自定义Hooks
 * 封装商品API调用逻辑
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useStaticTranslations } from '@/hooks/use-i18n';

// 商品类型定义
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  sku: string;
  price: number;
  comparePrice?: number;
  currency: string;
  status: string;
  isDigital: boolean;
  trackInventory: boolean;
  allowOutOfStock: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    sortOrder: number;
  }>;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    attributes: Array<{
      name: string;
      value: string;
    }>;
  }>;
  inventory?: {
    quantity: number;
    reservedQuantity: number;
    lowStockThreshold: number;
  };
  reviews?: Array<{
    id: string;
    rating: number;
    title?: string;
    content?: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    createdAt: string;
  }>;
  averageRating: number;
  reviewCount: number;
  availableQuantity: number;
  inStock: boolean;
  isLowStock?: boolean;
}

// 商品列表查询参数
export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

// 分页信息
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API响应类型
interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: Pagination;
  filters: {
    search?: string;
    category?: string;
    status?: string;
    priceRange: {
      min?: number;
      max?: number;
    };
  };
}

interface ProductDetailResponse {
  success: boolean;
  data: Product;
}

// 获取商品列表的Hook
export function useProducts(query: ProductQuery = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useStaticTranslations('product');

  // 将query转换为稳定的字符串key，避免对象引用变化导致的无限循环
  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  const fetchProducts = useCallback(async (searchQuery: ProductQuery = {}) => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询参数
      const params = new URLSearchParams();
      const mergedQuery = { ...JSON.parse(queryKey), ...searchQuery };
      
      Object.entries(mergedQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/products?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ProductListResponse = await response.json();

      if (result.success) {
        setProducts(result.data);
        setPagination(result.pagination);
      } else {
        const message = t('toast.listFailed');
        setError(message);
        toast.error(message);
      }
    } catch (error) {
      const errorMessage = t('toast.networkError');
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(t('toast.listFailed'), error);
    } finally {
      setLoading(false);
    }
  }, [queryKey, t]);

  const initialFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialFetchKeyRef.current === queryKey) {
      return;
    }
    initialFetchKeyRef.current = queryKey;
    fetchProducts();
  }, [fetchProducts, queryKey]);

  const refetch = useCallback((newQuery?: ProductQuery) => {
    fetchProducts(newQuery);
  }, [fetchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    fetchProducts,
    refetch,
  };
}

// 获取单个商品详情的Hook
export function useProduct(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useStaticTranslations('product');

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${productId}`);
      const result: ProductDetailResponse = await response.json();

      if (result.success) {
        setProduct(result.data);
      } else {
        const errorMsg = t('toast.detailFailed');
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMessage = t('toast.networkError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const refetch = useCallback(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch,
  };
}

// 搜索商品的Hook
export function useProductSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useStaticTranslations('product');

  const search = useCallback(async (searchTerm: string, filters: Partial<ProductQuery> = {}) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null),
        ),
      });

      const response = await fetch(`/api/products?${params}`);
      const result: ProductListResponse = await response.json();

      if (result.success) {
        setResults(result.data);
      } else {
        const message = t('toast.searchFailed');
        setError(message);
        setResults([]);
      }
    } catch (error) {
      setError(t('toast.searchFailed'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}
