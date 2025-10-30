/**
 * 商品管理页面
 * 实现商品的增删改查(CRUD)功能
 * 包括:商品列表、搜索筛选、添加商品、编辑商品、删除商品、库存管理
 */

'use client';

import { useEffect, useState } from 'react';
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
  inventory?: { quantity: number };
}

// 分类接口
interface Category {
  id: string;
  name: string;
  slug: string;
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
  const [formData, setFormData] = useState({
    name: '',
    shortDesc: '',
    description: '',
    sku: '',
    price: '',
    comparePrice: '',
    categoryId: '',
    status: 'PUBLISHED' as Product['status'],
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
    });
    setImageUrls(product.images?.map(img => img.url) || []);
    setIsEditDialogOpen(true);
  };

  // 添加商品
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

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: `${slug}-${Date.now()}`,
          shortDesc: formData.shortDesc,
          description: formData.description,
          sku: formData.sku,
          price: parseFloat(formData.price),
          comparePrice: formData.comparePrice
            ? parseFloat(formData.comparePrice)
            : null,
          categoryId: formData.categoryId,
          status: formData.status,
          images: imageUrls.map((url, index) => ({
            url,
            alt: formData.name,
            sortOrder: index,
          })),
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

      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          shortDesc: formData.shortDesc || '',
          description: formData.description || '',
          sku: formData.sku,
          price: parseFloat(formData.price),
          comparePrice: formData.comparePrice
            ? parseFloat(formData.comparePrice)
            : null,
          categoryId: formData.categoryId,
          status: formData.status,
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
      <div className="space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">商品管理</h1>
            <p className="mt-1 text-gray-600">
              管理所有商品信息,包括添加、编辑和删除商品
            </p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            添加商品
          </Button>
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
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded border">
                              {product.images?.[0]?.url ? (
                                <Image
                                  src={product.images[0].url}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100">
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
                              ${Number(product.price).toFixed(2)}
                            </div>
                            {product.comparePrice && (
                              <div className="text-sm text-gray-400 line-through">
                                ${Number(product.comparePrice).toFixed(2)}
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 添加商品对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加新商品</DialogTitle>
            <DialogDescription>填写商品信息添加新商品到系统中</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">商品名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="输入商品名称"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortDesc">简短描述</Label>
              <Input
                id="shortDesc"
                value={formData.shortDesc}
                onChange={(e) =>
                  setFormData({ ...formData, shortDesc: e.target.value })
                }
                placeholder="一句话描述商品"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">详细描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="详细描述商品特点和功能"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="商品SKU编码"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoryId">分类 *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">售价 *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comparePrice">划线价</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  step="0.01"
                  value={formData.comparePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, comparePrice: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
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
            <div className="grid gap-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Product['status']) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">已发布</SelectItem>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="ARCHIVED">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑商品</DialogTitle>
            <DialogDescription>修改商品信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">商品名称 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="输入商品名称"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-shortDesc">简短描述</Label>
              <Input
                id="edit-shortDesc"
                value={formData.shortDesc}
                onChange={(e) =>
                  setFormData({ ...formData, shortDesc: e.target.value })
                }
                placeholder="一句话描述商品"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">详细描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="详细描述商品特点和功能"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-sku">SKU *</Label>
                <Input
                  id="edit-sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="商品SKU编码"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-categoryId">分类 *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">售价 *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-comparePrice">划线价</Label>
                <Input
                  id="edit-comparePrice"
                  type="number"
                  step="0.01"
                  value={formData.comparePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, comparePrice: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
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
            <div className="grid gap-2">
              <Label htmlFor="edit-status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Product['status']) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">已发布</SelectItem>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="ARCHIVED">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
