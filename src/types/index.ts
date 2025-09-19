/**
 * 通用类型定义
 */

// 基础API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页信息类型
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

// 排序类型
export type SortOrder = 'asc' | 'desc';

// 状态类型
export type Status = 'pending' | 'loading' | 'success' | 'error';

// 主题类型
export type Theme = 'light' | 'dark' | 'system';

// 语言类型
export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

// 货币类型
export type Currency = 'USD' | 'CNY' | 'EUR' | 'GBP' | 'JPY' | 'KRW';

// 文件上传类型
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  status?: 'uploading' | 'success' | 'error';
}

// 搜索过滤器类型
export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  rating?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
}

// 地址类型
export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

// 通用表单状态
export interface FormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 购物车项目类型
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
  attributes?: Array<{
    name: string;
    value: string;
  }>;
}

// 导出Prisma生成的类型
export type {
  User,
  Product,
  Category,
  Brand,
  Order,
  OrderItem,
  Review,
  Address as PrismaAddress,
  UserRole,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
