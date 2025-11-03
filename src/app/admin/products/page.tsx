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

const OSS_BASE_URL = process.env.NEXT_PUBLIC_OSS_BASE_URL || process.env.BASE_OSS_URL;
const OSS_FOLDER = process.env.OSS_FOLDER && process.env.OSS_FOLDER !== 'root' ? process.env.OSS_FOLDER : undefined;
const PLACEHOLDER_IMAGE = OSS_BASE_URL
  ? `${OSS_BASE_URL.replace(/\/+$/u, '')}/${OSS_FOLDER ? `${OSS_FOLDER.replace(/\/+$/gu, '')}/` : ''}placeholder.png`
  : 'https://next-static-oss.oss-rg-china-mainland.aliyuncs.com/placeholder.png';

const resolveImageUrl = (src?: string | null) => {
  if (!src) {
    return PLACEHOLDER_IMAGE;
  }

  try {
    const url = new URL(src);
    if (url.hostname.endsWith('aliyuncs.com')) {
      return url.toString();
    }
    if (OSS_BASE_URL && src.startsWith(OSS_BASE_URL)) {
      return src;
    }
  } catch (error) {
    // ignore
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
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // 加载商品列表
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // 获取商品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?limit=100');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // 筛选商品
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
      .filter((url) => url && url.trim())
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

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flattenedCategoryOptions = useMemo(
    () => flattenCategories(categoryTree),
    [categoryTree],
  );
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
      const response = await fetch(
        editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories',
        {
          method: editingCategory ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(editingCategory ? '分类更新成功' : '分类创建成功');
        setIsCategoryDialogOpen(false);
        resetCategoryForm();
        fetchCategories();
      } else {
        toast.error(data.message || data.error || '保存分类失败');
      }
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('保存分类失败');
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
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok && data.success) {
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
      } else {
        toast.error(data.message || data.error || '删除分类失败');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('删除分类失败');
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

  const renderCategoryItem = (category: Category, depth = 0, order = 0): ReactNode => {
    const itemKey = `cat-${category.id}-depth-${depth}-idx-${order}`;
    return (
      <div key={itemKey} className="space-y-2">
        <div
          style={{ paddingLeft: depth * 16 }}
          className="group flex items-center justify-between rounded-md border bg-background p-2 text-xs shadow-sm transition hover:border-primary/40 hover:bg-muted/60"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate text-sm">{category.name}</span>
              <Badge variant={category.isActive === false ? 'secondary' : 'default'} className="shrink-0 px-1 py-0 text-[10px]">
                {category.isActive === false ? '禁用' : '启用'}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {category.slug}
              {typeof category._count?.products === 'number' && category._count.products > 0 && (
                <span className="ml-2">商品 {category._count.products}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleOpenEditCategory(category)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500 hover:text-red-600"
              onClick={() => handleOpenDeleteCategory(category)}
            >
              <Trash2 className="h-3 w-3" />
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

      const response = await fetch('/api/products', {
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
          images: imagesPayload,
          trackInventory: formData.trackInventory,
          allowOutOfStock: formData.allowOutOfStock,
          inventoryQuantity: formData.trackInventory ? inventoryQuantityValue : 0,
          lowStockThreshold: formData.trackInventory ? lowStockThresholdValue : 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('商品添加成功');
        setIsAddDialogOpen(false);
        resetForm();
        fetchProducts();
      } else {
        toast.error(data.error || '添加商品失败');
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('添加商品失败');
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

      const response = await fetch(`/api/products/${selectedProduct.id}`, {
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
          images: imagesPayload,
          trackInventory: formData.trackInventory,
          allowOutOfStock: formData.allowOutOfStock,
          inventoryQuantity: formData.trackInventory ? inventoryQuantityValue : undefined,
          lowStockThreshold: formData.trackInventory ? lowStockThresholdValue : undefined,
        }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        toast.success('商品更新成功');
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
        resetForm();
        fetchProducts();
      } else {
        // 详细显示错误信息
        if (data.details && Array.isArray(data.details)) {
          // 显示验证错误详情
          const errorMessages = data.details.map((err: any) => 
            `${err.path}: ${err.message}`
          ).join('\n');
          toast.error(`更新失败:\n${errorMessages}`);
          console.error('验证错误详情:', data.details);
        } else {
          toast.error(data.message || data.error || '更新商品失败');
        }
        console.error('Update error:', data);
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error(error instanceof Error ? error.message : '更新商品失败');
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
      const response = await fetch(`/api/products/${productToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('商品删除成功');
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
        fetchProducts();
      } else {
        toast.error(data.message || data.error || '删除商品失败');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('删除商品失败');
    }
  };

  // 切换商品选择
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
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
      let successCount = 0;
      
      switch (action) {
        case 'publish':
          // 批量发布
          for (const productId of selectedProducts) {
            const response = await fetch(`/api/products/${productId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'PUBLISHED' }),
            });
            if (response.ok) successCount++;
          }
          toast.success(`成功发布 ${successCount} 个商品`);
          break;
          
        case 'unpublish':
          // 批量下架
          for (const productId of selectedProducts) {
            const response = await fetch(`/api/products/${productId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'DRAFT' }),
            });
            if (response.ok) successCount++;
          }
          toast.success(`成功下架 ${successCount} 个商品`);
          break;
          
        case 'delete':
          // 批量删除 - 打开确认对话框
          setIsBulkDeleteDialogOpen(true);
          return;
      }
      
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('批量操作失败');
    }
  };

  // 批量删除商品
  const handleBulkDeleteProducts = async () => {
    try {
      let successCount = 0;
      for (const productId of selectedProducts) {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
        });
        if (response.ok) successCount++;
      }
      toast.success(`成功删除 ${successCount} 个商品`);
      setIsBulkDeleteDialogOpen(false);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('批量删除失败');
    }
  };

  // 快速切换商品状态
  const toggleProductStatus = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newStatus = product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`商品已${newStatus === 'PUBLISHED' ? '发布' : '下架'}`);
        fetchProducts();
      } else {
        toast.error('状态切换失败');
      }
    } catch (error) {
      console.error('Toggle status failed:', error);
      toast.error('状态切换失败');
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
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-24">
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
            </CardHeader>
            <CardContent className="pb-4">
              {categoryTree.length > 0 ? (
                <div className="max-h-[calc(100vh-280px)] space-y-1 overflow-y-auto pr-1">
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

        <div className="space-y-6">
          {/* 页头 */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">商品管理</h1>
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

          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总商品数</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已发布</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter((p) => p.status === 'PUBLISHED').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">低库存</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
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
                <Table>
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
                  <TableBody>
                    {filteredProducts.map((product) => {
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
