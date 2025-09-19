/**
 * 商品相关的自定义Hooks
 * 封装商品API调用逻辑
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';

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
  brand?: {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (searchQuery: ProductQuery = {}) => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询参数
      const params = new URLSearchParams();
      Object.entries({ ...query, ...searchQuery }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/products?${params}`);
      const result: ProductListResponse = await response.json();

      if (result.success) {
        setProducts(result.data);
        setPagination(result.pagination);
      } else {
        setError('获取商品列表失败');
        message.error('获取商品列表失败');
      }
    } catch (error) {
      const errorMessage = '网络错误，请重试';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetch = useCallback((newQuery?: ProductQuery) => {
    fetchProducts(newQuery);
  }, [fetchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    refetch,
  };
}

// 获取单个商品详情的Hook
export function useProduct(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(result.message || '获取商品详情失败');
        message.error(result.message || '获取商品详情失败');
      }
    } catch (error) {
      const errorMessage = '网络错误，请重试';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

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
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
        ),
      });

      const response = await fetch(`/api/products?${params}`);
      const result: ProductListResponse = await response.json();

      if (result.success) {
        setResults(result.data);
      } else {
        setError('搜索失败');
        setResults([]);
      }
    } catch (error) {
      setError('搜索失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
