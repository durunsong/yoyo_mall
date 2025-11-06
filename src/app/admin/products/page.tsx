/**
 * 商品管理页面
 * 实现商品的增删改查(CRUD)功能
 * 包括:商品列表、搜索筛选、添加商品、编辑商品、删除商品、库存管理
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { ImageUpload } from '@/components/admin/image-upload';
import { BulkActions } from '@/components/admin/bulk-actions';
import { PaginationControls } from '@/components/ui/pagination-controls';

const OSS_BASE_URL = process.env.NEXT_PUBLIC_OSS_BASE_URL || process.env.BASE_OSS_URL;
const OSS_FOLDER = process.env.OSS_FOLDER && process.env.OSS_FOLDER !== 'root' ? process.env.OSS_FOLDER : undefined;
const PLACEHOLDER_IMAGE = OSS_BASE_URL
  ? `${OSS_BASE_URL.replace(/\/+$/u, '')}/${OSS_FOLDER ? `${OSS_FOLDER.replace(/\/+$/gu, '')}/` : ''}placeholder.png`
  : 'https://next-static-oss.oss-rg-china-mainland.aliyuncs.com/placeholder.png';

const resolveImageUrl = (src?: string | null) => {
  if (!src) {
    return PLACEHOLDER_IMAGE;
  }

  const trimmed = src.trim();
  if (!trimmed) {
    return PLACEHOLDER_IMAGE;
  }

  if (OSS_BASE_URL && trimmed.startsWith(OSS_BASE_URL)) {
    return trimmed;
  }

  if (/^https?:\/\//iu.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  try {
    const url = new URL(trimmed, 'http://localhost');
    return url.toString();
  } catch (error) {
    if (trimmed.startsWith('/')) {
      return trimmed;
    }
  }

  return PLACEHOLDER_IMAGE;
};

// 商品接口定义
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  sku: string;
  price: number;
  comparePrice?: number;
  currency: string;
  categoryId: string;
  brandId?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  images: { id: string; url: string; alt: string }[];
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  inventory?: { quantity: number; reservedQuantity?: number; lowStockThreshold?: number };
  trackInventory?: boolean;
  allowOutOfStock?: boolean;
}

// 分类接口
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number | null;
  children?: Category[];
  _count?: {
    products: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  details?: unknown;
  [key: string]: unknown;
}

interface ProductFormData {
  name: string;
  shortDesc: string;
  description: string;
  sku: string;
  price: string;
  comparePrice: string;
  categoryId: string;
  status: Product['status'];
  inventoryQuantity: string;
  lowStockThreshold: string;
  trackInventory: boolean;
  allowOutOfStock: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // 删除确认对话框
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false); // 批量删除确认对话框
  const [productToDelete, setProductToDelete] = useState<string | null>(null); // 待删除的商品ID
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    shortDesc: '',
    description: '',
    sku: '',
    price: '',
    comparePrice: '',
    categoryId: '',
    status: 'PUBLISHED',
    inventoryQuantity: '',
    lowStockThreshold: '10',
    trackInventory: true,
    allowOutOfStock: false,
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    isActive: true,
    sortOrder: '0',
  });
  const [categorySlugEdited, setCategorySlugEdited] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryDeleting, setCategoryDeleting] = useState(false);
  // 新增：分类搜索状态
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  // 新增：商品列表分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 每页显示10条商品
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  /**
   * 统一处理 API 请求，增加错误兜底提示
   * @param input 请求地址或 Request 对象
   * @param init 请求配置
   * @param defaultError 当接口返回失败且未提供 message 时的默认提示
   */
  const requestJson = async <T = unknown>(
    input: RequestInfo,
    init: RequestInit = {},
    defaultError = '请求失败',
  ): Promise<T> => {
    const response = await fetch(input, init);
    let payload: any = null;

    try {
      payload = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new Error(defaultError);
      }
    }

    if (!response.ok || (payload && payload.success === false)) {
      const message = payload?.message || payload?.error || defaultError;
      const errorObject = new Error(message);
      if (payload?.details) {
        (errorObject as Error & { details?: unknown }).details = payload.details;
      }
      if ('status' in response) {
        (errorObject as Error & { status?: number }).status = response.status;
      }
      throw errorObject;
    }

    return payload as T;
  };

  // 加载商品列表
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // 获取商品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const payload = await requestJson<ApiResponse<Product[]>>(
        '/api/products?limit=100',
        { cache: 'no-store' },
        '加载商品列表失败',
      );
      setProducts(payload.data ?? []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error(error instanceof Error ? error.message : '加载商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const payload = await requestJson<ApiResponse<Category[]>>(
        '/api/categories',
        { cache: 'no-store' },
        '加载分类失败',
      );
      setCategories(payload.data ?? []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error(error instanceof Error ? error.message : '加载分类失败');
    }
  };

  // 筛选商品
  // 过滤商品
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.categoryId === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 新增：分类搜索过滤
  const filteredCategories = useMemo(() => {
    if (!categorySearchTerm.trim()) {
      return categories;
    }
    
    const searchLower = categorySearchTerm.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchLower) ||
      category.slug.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower),
    );
  }, [categories, categorySearchTerm]);

  // 新增：商品分页计算
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 当筛选条件变化时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // 当总页数减少时，自动调整当前页
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      shortDesc: '',
      description: '',
      sku: '',
      price: '',
      comparePrice: '',
      categoryId: '',
      status: 'PUBLISHED',
      inventoryQuantity: '',
      lowStockThreshold: '10',
      trackInventory: true,
      allowOutOfStock: false,
    });
    setImageUrls([]);
  };

  // 打开添加对话框
  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      shortDesc: product.shortDesc || '',
      description: product.description || '',
      sku: product.sku,
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || '',
      categoryId: product.categoryId,
      status: product.status,
      inventoryQuantity: (product.inventory?.quantity ?? '').toString(),
      lowStockThreshold: (product.inventory?.lowStockThreshold ?? 10).toString(),
      trackInventory: product.trackInventory ?? true,
      allowOutOfStock: product.allowOutOfStock ?? false,
    });
    setImageUrls(product.images?.map(img => img.url) || []);
    setIsEditDialogOpen(true);
  };

  // 添加商品
  const parsePositiveNumber = (value: string) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const parseNonNegativeInt = (value: string, fallback = 0) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  const buildImagePayload = (name: string) =>
    imageUrls
      .map((url, index) => ({
        url,
        alt: `${name} 图片 ${index + 1}`,
        sortOrder: index,
      }));

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');

  const buildCategoryTree = (items: Category[]): Category[] => {
    const map = new Map<string, Category & { children: Category[] }>();

    items.forEach((item) => {
      map.set(item.id, {
        ...item,
        children: Array.isArray(item.children) ? [...item.children] : [],
      });
    });

    const roots: Category[] = [];

    map.forEach((item) => {
      if (item.parentId && map.has(item.parentId)) {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(item);
        }
      } else {
        roots.push(item);
      }
    });

    const sortNodes = (nodes: Category[]) => {
      nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(roots);
    return roots;
  };

  const flattenCategories = (nodes: Category[], depth = 0): { id: string; name: string; depth: number }[] => {
    return nodes.flatMap((node) => {
      const current = [{ id: node.id, name: node.name, depth }];
      if (node.children && node.children.length > 0) {
        return current.concat(flattenCategories(node.children, depth + 1));
      }
      return current;
    });
  };

  const findCategoryInTree = (nodes: Category[], id: string): Category | undefined => {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = findCategoryInTree(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  };

  const getDescendantIds = (node?: Category): string[] => {
    if (!node || !node.children) {
      return [];
    }
    return node.children.reduce<string[]>((acc, child) => {
      acc.push(child.id);
      acc.push(...getDescendantIds(child));
      return acc;
    }, []);
  };

  // 构建分类树 - 使用过滤后的分类
  const categoryTree = useMemo(() => buildCategoryTree(filteredCategories), [filteredCategories]);
  const flattenedCategoryOptions = useMemo(() => {
    /**
     * 将分类树拍平成扁平数组，并使用 Set 过滤重复 ID，避免 Select 渲染 key 冲突。
     * 部分后端接口会同时返回树形 children 和重复的父级节点，若不去重会导致 React 报错。
     */
    const flattened = flattenCategories(categoryTree);
    const seen = new Set<string>();
    return flattened.filter((option) => {
      if (seen.has(option.id)) {
        return false;
      }
      seen.add(option.id);
      return true;
    });
  }, [categoryTree]);
  const availableParentOptions = useMemo(() => {
    if (!editingCategory) {
      return flattenedCategoryOptions;
    }
    const categoryNode = findCategoryInTree(categoryTree, editingCategory.id) ?? editingCategory;
    const excluded = new Set<string>([editingCategory.id, ...getDescendantIds(categoryNode)]);
    return flattenedCategoryOptions.filter((option) => !excluded.has(option.id));
  }, [categoryTree, editingCategory, flattenedCategoryOptions]);

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      parentId: '',
      isActive: true,
      sortOrder: '0',
    });
    setCategorySlugEdited(false);
    setEditingCategory(null);
  };

  const handleOpenCreateCategory = () => {
    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    const categoryInTree = findCategoryInTree(categoryTree, category.id) ?? category;
    setEditingCategory(categoryInTree);
    setCategoryForm({
      name: categoryInTree.name,
      slug: categoryInTree.slug,
      description: categoryInTree.description ?? '',
      parentId: categoryInTree.parentId ?? '',
      isActive: categoryInTree.isActive ?? true,
      sortOrder: (categoryInTree.sortOrder ?? 0).toString(),
    });
    setCategorySlugEdited(true);
    setIsCategoryDialogOpen(true);
  };

  const handleCategoryNameChange = (value: string) => {
    setCategoryForm((prev) => ({
      ...prev,
      name: value,
      slug: categorySlugEdited ? prev.slug : slugify(value),
    }));
  };

  const handleCategorySlugChange = (value: string) => {
    setCategorySlugEdited(true);
    const normalized = slugify(value) || value.trim();
    setCategoryForm((prev) => ({
      ...prev,
      slug: normalized,
    }));
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }
    if (!categoryForm.slug.trim()) {
      toast.error('请输入分类标识');
      return;
    }

    const payload = {
      name: categoryForm.name.trim(),
      slug: slugify(categoryForm.slug),
      description: categoryForm.description.trim() ? categoryForm.description.trim() : undefined,
      parentId: categoryForm.parentId ? categoryForm.parentId : null,
      isActive: categoryForm.isActive,
      sortOrder: parseNonNegativeInt(categoryForm.sortOrder, 0),
    };

    try {
      setCategorySubmitting(true);
      await requestJson<ApiResponse<Category>>(
        editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories',
        {
          method: editingCategory ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        editingCategory ? '更新分类失败' : '创建分类失败',
      );
      toast.success(editingCategory ? '分类更新成功' : '分类创建成功');
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(error instanceof Error ? error.message : '保存分类失败');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleOpenDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setIsCategoryDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setCategoryDeleting(true);
      await requestJson<ApiResponse<null>>(
        `/api/categories/${categoryToDelete.id}`,
        { method: 'DELETE' },
        '删除分类失败',
      );
      toast.success('分类删除成功');
      if (categoryFilter === categoryToDelete.id) {
        setCategoryFilter('all');
      }
      if (formData.categoryId === categoryToDelete.id) {
        setFormData((prev) => ({
          ...prev,
          categoryId: '',
        }));
      }
      setIsCategoryDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error(error instanceof Error ? error.message : '删除分类失败');
    } finally {
      setCategoryDeleting(false);
    }
  };

  const renderInventoryFields = (idPrefix: string) => (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor={`${idPrefix}-track-inventory`} className="text-base font-medium">
            库存跟踪
          </Label>
          <p className="text-sm text-muted-foreground">
            启用后可设置库存数量并在库存不足时提示。
          </p>
        </div>
        <Switch
          id={`${idPrefix}-track-inventory`}
          checked={formData.trackInventory}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              trackInventory: checked,
            }))
          }
        />
      </div>

      {formData.trackInventory && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-inventoryQuantity`}>库存数量</Label>
            <Input
              id={`${idPrefix}-inventoryQuantity`}
              type="number"
              min={0}
              value={formData.inventoryQuantity}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  inventoryQuantity: e.target.value,
                }))
              }
              placeholder="0"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-lowStockThreshold`}>低库存提醒</Label>
            <Input
              id={`${idPrefix}-lowStockThreshold`}
              type="number"
              min={0}
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lowStockThreshold: e.target.value,
                }))
              }
              placeholder="10"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor={`${idPrefix}-allow-out-of-stock`} className="text-base font-medium">
            允许缺货购买
          </Label>
          <p className="text-sm text-muted-foreground">
            开启后即使库存为0，也允许用户下单购买。
          </p>
        </div>
        <Switch
          id={`${idPrefix}-allow-out-of-stock`}
          checked={formData.allowOutOfStock}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              allowOutOfStock: checked,
            }))
          }
        />
      </div>
    </div>
  );

  const renderProductForm = (idPrefix: 'add' | 'edit') => (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-name`}>商品名称 *</Label>
            <Input
              id={`${idPrefix}-name`}
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="输入商品名称"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-shortDesc`}>简短描述</Label>
            <Input
              id={`${idPrefix}-shortDesc`}
              value={formData.shortDesc}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  shortDesc: e.target.value,
                }))
              }
              placeholder="一句话描述商品"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-description`}>详细描述</Label>
            <Textarea
              id={`${idPrefix}-description`}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="详细描述商品特点和功能"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-sku`}>SKU *</Label>
              <Input
                id={`${idPrefix}-sku`}
                value={formData.sku}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sku: e.target.value,
                  }))
                }
                placeholder="商品SKU编码"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-category`}>分类 *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: value,
                  }))
                }
              >
                <SelectTrigger id={`${idPrefix}-category`}>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {flattenedCategoryOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {`${option.depth > 0 ? `${'— '.repeat(option.depth)}` : ''}${option.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-price`}>售价 *</Label>
              <Input
                id={`${idPrefix}-price`}
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-comparePrice`}>划线价</Label>
              <Input
                id={`${idPrefix}-comparePrice`}
                type="number"
                step="0.01"
                value={formData.comparePrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    comparePrice: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {renderInventoryFields(idPrefix)}

          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-status`}>状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Product['status']) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value,
                }))
              }
            >
              <SelectTrigger id={`${idPrefix}-status`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLISHED">已发布</SelectItem>
                <SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="ARCHIVED">已归档</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>商品图片</Label>
            <ImageUpload
              value={imageUrls}
              onChange={setImageUrls}
              maxFiles={5}
              disabled={submitting}
            />
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 渲染单个分类节点
   * @param category 当前分类节点对象
   * @param depth 当前节点层级，用于控制缩进与层级展示
   * @param order 同层级下的排序索引，作为 React key 的补充
   * @description
   * - 统一分类块的视觉样式，保证 hover 时才出现操作按钮，避免界面拥挤
   * - 通过 marginLeft 控制缩进，使多级分类树在移动端也保持可读性
   * - 结合启用状态与商品数量，向运营同学提供快速判断的辅助信息
   */
  const renderCategoryItem = (category: Category, depth = 0, order = 0): ReactNode => {
    const itemKey = `cat-${category.id}-depth-${depth}-idx-${order}`;
    const indent = Math.min(depth, 6) * 12;
    const productCount = category._count?.products ?? 0;
    const isInactive = category.isActive === false;

    return (
      <div key={itemKey} className="space-y-2">
        <div
          className="group flex items-center gap-3 rounded-xl border border-border bg-background px-2 md:px-3 py-3 text-xs shadow-sm transition hover:border-primary hover:bg-muted"
        >
          {indent > 0 ? <div style={{ width: indent }} className="shrink-0" /> : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{category.name}</span>
                <Badge
                  variant={isInactive ? 'secondary' : 'default'}
                  className={`shrink-0 px-1.5 py-0 text-[10px] ${isInactive ? 'opacity-80' : ''}`}
                >
                  {isInactive ? '禁用' : '启用'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <span className="truncate max-w-[160px]">{category.slug}</span>
                {productCount > 0 && <span className="whitespace-nowrap">商品 {productCount}</span>}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleOpenEditCategory(category)}
              aria-label="编辑分类"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500 hover:text-red-600"
              onClick={() => handleOpenDeleteCategory(category)}
              aria-label="删除分类"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {category.children && category.children.length > 0 && (
          <div className="space-y-2">
            {category.children.map((child, childIndex) => renderCategoryItem(child, depth + 1, childIndex))}
          </div>
        )}
      </div>
    );
  };

  const handleAddProduct = async () => {
    try {
      setSubmitting(true);

      // 验证必填字段
      if (!formData.name || !formData.sku || !formData.price || !formData.categoryId) {
        toast.error('请填写所有必填字段');
        return;
      }

      // 生成slug
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-|-$/g, '');

      const priceValue = Number.parseFloat(formData.price);
      if (!Number.isFinite(priceValue) || priceValue <= 0) {
        toast.error('请输入有效的售价');
        return;
      }

      const normalizedComparePrice = parsePositiveNumber(formData.comparePrice);
      const inventoryQuantityValue = parseNonNegativeInt(formData.inventoryQuantity, 0);
      const lowStockThresholdValue = parseNonNegativeInt(formData.lowStockThreshold, 10);
      const imagesPayload = buildImagePayload(formData.name);

      const response = await requestJson<ApiResponse<Product>>(
        '/api/products',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            slug: `${slug}-${Date.now()}`,
            shortDesc: formData.shortDesc,
            description: formData.description,
            sku: formData.sku,
            price: priceValue,
            comparePrice: normalizedComparePrice,
            categoryId: formData.categoryId,
            status: formData.status,
            images: imagesPayload.filter((image) => image.url && image.url.trim()),
            trackInventory: formData.trackInventory,
            allowOutOfStock: formData.allowOutOfStock,
            inventoryQuantity: formData.trackInventory ? inventoryQuantityValue : 0,
            lowStockThreshold: formData.trackInventory ? lowStockThresholdValue : 10,
          }),
        },
        '添加商品失败',
      );

      toast.success('商品添加成功');
      setIsAddDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error(error instanceof Error ? error.message : '添加商品失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 更新商品
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    // 验证必填字段
    if (!formData.name?.trim()) {
      toast.error('请输入商品名称');
      return;
    }
    if (!formData.sku?.trim()) {
      toast.error('请输入SKU');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('请输入有效的价格');
      return;
    }
    if (!formData.categoryId) {
      toast.error('请选择分类');
      return;
    }

    try {
      setSubmitting(true);

      const priceValue = Number.parseFloat(formData.price);
      if (!Number.isFinite(priceValue) || priceValue <= 0) {
        toast.error('请输入有效的价格');
        return;
      }

      const normalizedComparePrice = parsePositiveNumber(formData.comparePrice);
      const inventoryQuantityValue = parseNonNegativeInt(formData.inventoryQuantity, 0);
      const lowStockThresholdValue = parseNonNegativeInt(formData.lowStockThreshold, 10);
      const imagesPayload = buildImagePayload(formData.name || selectedProduct.name);

      await requestJson<ApiResponse<Product>>(
        `/api/products/${selectedProduct.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            shortDesc: formData.shortDesc || '',
            description: formData.description || '',
            sku: formData.sku,
            price: priceValue,
            comparePrice: normalizedComparePrice,
            categoryId: formData.categoryId,
            status: formData.status,
            images: imagesPayload.filter((image) => image.url && image.url.trim()),
            trackInventory: formData.trackInventory,
            allowOutOfStock: formData.allowOutOfStock,
            inventoryQuantity: formData.trackInventory ? inventoryQuantityValue : undefined,
            lowStockThreshold: formData.trackInventory ? lowStockThresholdValue : undefined,
          }),
        },
        '更新商品失败',
      );

      toast.success('商品更新成功');
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Failed to update product:', error);
      if (error instanceof Error && (error as Error & { details?: unknown }).details) {
        const details = (error as Error & { details?: any }).details;
        if (Array.isArray(details)) {
          const errorMessages = details
            .map((detail: any) => `${detail.path ?? '字段'}: ${detail.message ?? ''}`)
            .join('\n');
          toast.error(`更新失败:\n${errorMessages}`);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(error instanceof Error ? error.message : '更新商品失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // 删除商品
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await requestJson<ApiResponse<null>>(
        `/api/products/${productToDelete}`,
        { method: 'DELETE' },
        '删除商品失败',
      );

      toast.success('商品删除成功');
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error(error instanceof Error ? error.message : '删除商品失败');
    }
  };

  // 切换商品选择
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  // 批量操作处理
  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('请先选择商品');
      return;
    }

    try {
      if (action === 'delete') {
        setIsBulkDeleteDialogOpen(true);
        return;
      }

      setBulkProcessing(true);
      let successCount = 0;

      const execute = async (productId: string, payload: Record<string, unknown>) => {
        try {
          await requestJson<ApiResponse<Product>>(
            `/api/products/${productId}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            },
            '批量操作失败',
          );
          successCount += 1;
        } catch (error) {
          console.error('Bulk action failed:', error);
        }
      };

      switch (action) {
        case 'publish':
          await Promise.all(
            selectedProducts.map((productId) => execute(productId, { status: 'PUBLISHED' })),
          );
          if (successCount > 0) {
            toast.success(`成功发布 ${successCount} 个商品`);
          }
          break;

        case 'unpublish':
          await Promise.all(
            selectedProducts.map((productId) => execute(productId, { status: 'DRAFT' })),
          );
          if (successCount > 0) {
            toast.success(`成功下架 ${successCount} 个商品`);
          }
          break;
        default:
          toast.error('暂不支持的批量操作');
          return;
      }

      if (successCount < selectedProducts.length) {
        toast.error(`有 ${selectedProducts.length - successCount} 个商品操作失败`);
      }

      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('批量操作失败');
    } finally {
      setBulkProcessing(false);
    }
  };

  // 批量删除商品
  const handleBulkDeleteProducts = async () => {
    try {
      setBulkProcessing(true);
      let successCount = 0;
      await Promise.all(
        selectedProducts.map(async (productId) => {
          try {
            await requestJson<ApiResponse<null>>(
              `/api/products/${productId}`,
              { method: 'DELETE' },
              '删除商品失败',
            );
            successCount += 1;
          } catch (error) {
            console.error('Bulk delete failed:', error);
          }
        }),
      );

      if (successCount > 0) {
        toast.success(`成功删除 ${successCount} 个商品`);
      }
      if (successCount < selectedProducts.length) {
        toast.error(`仍有 ${selectedProducts.length - successCount} 个商品删除失败`);
      }
      setIsBulkDeleteDialogOpen(false);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('批量删除失败');
    } finally {
      setBulkProcessing(false);
    }
  };

  // 快速切换商品状态
  const toggleProductStatus = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newStatus = product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    try {
      await requestJson<ApiResponse<Product>>(
        `/api/products/${productId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
        '状态切换失败',
      );
      toast.success(`商品已${newStatus === 'PUBLISHED' ? '发布' : '下架'}`);
      fetchProducts();
    } catch (error) {
      console.error('Toggle status failed:', error);
      toast.error(error instanceof Error ? error.message : '状态切换失败');
    }
  };

  // 状态Badge颜色
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'default';
      case 'DRAFT':
        return 'secondary';
      case 'ARCHIVED':
        return 'outline';
      default:
        return 'default';
    }
  };

  // 状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return '已发布';
      case 'DRAFT':
        return '草稿';
      case 'ARCHIVED':
        return '已归档';
      default:
        return status;
    }
  };

  return (
    <AdminLayout>
      {/* 商品管理主容器，左侧分类面板在大屏保持窄列，移动端自动换行 */}
      <div className="grid gap-4 lg:grid-cols-[minmax(200px,240px)_1fr] xl:grid-cols-[minmax(220px,280px)_1fr]">
        <div className="space-y-4">
          {/* 调整高度与滚动：固定卡片高度，内部内容独立滚动，避免分类过多时被裁切 */}
          <Card className="flex flex-col lg:sticky lg:h-[calc(100vh-95px)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">分类管理</CardTitle>
                  <CardDescription className="text-xs">管理并组织商品分类</CardDescription>
                </div>
                <Button size="sm" onClick={handleOpenCreateCategory} className="h-8">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  新增
                </Button>
              </div>
              {/* 新增：分类搜索框 */}
              <div className="relative mt-3">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索分类..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </CardHeader>
            {/* 重要：给内容区域 min-h-0 与 overflow-y-auto，使其在 flex 布局下可滚动；同时统一左右内边距，避免视觉不居中 */}
            <CardContent className="flex-1 space-y-1 min-h-0 overflow-y-auto px-3 pb-3">
              {categoryTree.length > 0 ? (
                <div className="space-y-2 px-1">
                  {categoryTree.map((category, index) => renderCategoryItem(category, 0, index))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  暂无分类，请先创建。
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {/* 页头 */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">商品管理</h1>
              <p className="mt-1 text-gray-600">
                管理所有商品信息,包括添加、编辑和删除商品
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleOpenCreateCategory}>
                <Plus className="mr-2 h-4 w-4" />
                新增分类
              </Button>
              <Button onClick={handleOpenAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                添加商品
              </Button>
            </div>
          </div>

          {/* 统计卡片（紧凑版） */}
          <div className="grid gap-2 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">总商品数</CardTitle>
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-xl font-bold leading-none">{products.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">已发布</CardTitle>
                <Package className="h-3.5 w-3.5 text-green-600" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-xl font-bold leading-none">
                  {products.filter((p) => p.status === 'PUBLISHED').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">低库存</CardTitle>
                <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-xl font-bold leading-none">
                  {
                    products.filter(
                      (p) => (p.inventory?.quantity || 0) <= 10 && (p.inventory?.quantity || 0) > 0,
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选和搜索 */}
          <Card>
          <CardHeader>
            <CardTitle>商品列表</CardTitle>
            <CardDescription>筛选和管理所有商品</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索商品名称或SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 分类筛选 */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分类</SelectItem>
                  {flattenedCategoryOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {`${option.depth > 0 ? `${'— '.repeat(option.depth)}` : ''}${option.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="PUBLISHED">已发布</SelectItem>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="ARCHIVED">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 批量操作 */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <BulkActions
                  selectedIds={selectedProducts}
                  actions={[
                    { label: '批量发布', value: 'publish', icon: CheckCircle },
                    { label: '批量下架', value: 'unpublish', icon: XCircle },
                    { label: '批量删除', value: 'delete', icon: Trash2, variant: 'destructive' },
                  ]}
                      disabled={bulkProcessing}
                  onAction={handleBulkAction}
                  onClearSelection={() => setSelectedProducts([])}
                />
              </div>
            )}

            {/* 商品表格 */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Package className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p>暂无商品</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* 表头独立，不随表体滚动 */}
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>商品</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>价格</TableHead>
                      <TableHead>库存</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
                {/* 仅表体滚动 */}
                <div className="max-h-[45vh] overflow-y-auto overscroll-contain">
                  <Table className="w-full">
                  <TableBody>
                    {paginatedProducts.map((product) => {
                      const priceValue = Number(product.price ?? 0);
                      const comparePriceValue = Number(product.comparePrice ?? 0);
                      const hasComparePrice = Number.isFinite(comparePriceValue) && comparePriceValue > 0;
                      const hasPrimaryImage = (product.images?.length ?? 0) > 0;

                      return (
                        <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded border bg-gray-50">
                              <Image
                                src={resolveImageUrl(hasPrimaryImage ? product.images?.[0]?.url : undefined)}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                              {!hasPrimaryImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.shortDesc && (
                                <div className="text-sm text-gray-500">
                                  {product.shortDesc.slice(0, 40)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              ${priceValue.toFixed(2)}
                            </div>
                            {hasComparePrice && (
                              <div className="text-sm text-gray-400 line-through">
                                ${comparePriceValue.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (product.inventory?.quantity || 0) > 10
                                ? 'default'
                                : (product.inventory?.quantity || 0) > 0
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {product.inventory?.quantity || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.category?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(product.status)}>
                              {getStatusText(product.status)}
                            </Badge>
                            <Button
                              size="sm"
                              variant={product.status === 'PUBLISHED' ? 'outline' : 'default'}
                              onClick={() => toggleProductStatus(product.id)}
                              className="h-6 px-2 text-xs"
                            >
                              {product.status === 'PUBLISHED' ? '下架' : '发布'}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditDialog(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}

            {/* 新增：分页控件（同一行显示） */}
            {!loading && filteredProducts.length > 0 && (
              <div className="mt-4 flex w-full items-center justify-between gap-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  显示 {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} 条，
                  共 {filteredProducts.length} 条商品
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* 分类表单对话框 */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          setIsCategoryDialogOpen(open);
          if (!open) {
            resetCategoryForm();
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '新增分类'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? '更新分类信息，优化商品分组。' : '创建新的商品分类，帮助顾客快速找到商品。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="category-name">分类名称 *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
                placeholder="请输入分类名称"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-slug">URL 标识 *</Label>
              <Input
                id="category-slug"
                value={categoryForm.slug}
                onChange={(e) => handleCategorySlugChange(e.target.value)}
                placeholder="例如: home-appliances"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-parent">父级分类</Label>
              <Select
                value={categoryForm.parentId || 'root'}
                onValueChange={(value) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    parentId: value === 'root' ? '' : value,
                  }))
                }
              >
                <SelectTrigger id="category-parent">
                  <SelectValue placeholder="选择父级分类" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="root">无父级</SelectItem>
                  {availableParentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {`${option.depth > 0 ? `${'— '.repeat(option.depth)}` : ''}${option.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-description">描述</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="可选，简要描述该分类的用途"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="category-sort">排序权重</Label>
                <Input
                  id="category-sort"
                  type="number"
                  min={0}
                  value={categoryForm.sortOrder}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      sortOrder: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <Label htmlFor="category-active" className="font-medium">
                    是否启用
                  </Label>
                  <p className="text-xs text-muted-foreground">关闭后该分类不会在前台显示。</p>
                </div>
                <Switch
                  id="category-active"
                  checked={categoryForm.isActive}
                  onCheckedChange={(checked) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      isActive: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCategoryDialogOpen(false);
                resetCategoryForm();
              }}
              disabled={categorySubmitting}
            >
              取消
            </Button>
            <Button onClick={handleSaveCategory} disabled={categorySubmitting}>
              {categorySubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                editingCategory ? '保存修改' : '创建分类'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分类删除确认 */}
      <Dialog open={isCategoryDeleteDialogOpen} onOpenChange={setIsCategoryDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">确认删除分类</DialogTitle>
            <DialogDescription>
              确认删除分类
              <span className="font-medium text-foreground">
                {categoryToDelete ? `「${categoryToDelete.name}」` : ''}
              </span>
              ？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsCategoryDeleteDialogOpen(false);
                setCategoryToDelete(null);
              }}
              disabled={categoryDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={categoryDeleting}
            >
              {categoryDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加商品对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>添加新商品</DialogTitle>
            <DialogDescription>填写商品信息添加新商品到系统中</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {renderProductForm('add')}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleAddProduct} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                '添加商品'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑商品对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>编辑商品</DialogTitle>
            <DialogDescription>修改商品信息</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {renderProductForm('edit')}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleUpdateProduct} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新商品'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              确认删除
            </DialogTitle>
            <DialogDescription className="text-base">
              您确定要删除这个商品吗?
              <br />
              <span className="text-red-500 font-medium">
                此操作不可撤销,商品的所有相关数据将被永久删除。
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量删除确认对话框 */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              批量删除确认
            </DialogTitle>
            <DialogDescription className="text-base">
              您确定要删除选中的 <span className="font-bold text-red-600">{selectedProducts.length}</span> 个商品吗?
              <br />
              <span className="text-red-500 font-medium mt-2 block">
                此操作不可撤销,所有选中商品的相关数据将被永久删除。
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteProducts}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              确认删除 ({selectedProducts.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
