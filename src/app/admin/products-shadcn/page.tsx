/**
 * 商品管理页面 - shadcn/ui版本
 * 使用shadcn/ui组件和统一i18n系统
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useStaticTranslations } from '@/hooks/use-i18n';

// 表单验证schema
const productSchema = z.object({
  name: z.string().min(1, '请输入商品名称'),
  category: z.string().min(1, '请选择商品分类'),
  brand: z.string().min(1, '请输入品牌'),
  price: z.number().min(0, '价格必须大于0'),
  stock: z.number().min(0, '库存必须大于等于0'),
  description: z.string().min(1, '请输入商品描述'),
});

type ProductFormData = z.infer<typeof productSchema>;

// 模拟商品数据
const mockProducts = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    category: '手机数码',
    brand: 'Apple',
    price: 7999,
    stock: 50,
    status: 'active',
    description: '最新款iPhone，搭载A17 Pro芯片',
  },
  {
    id: '2',
    name: 'MacBook Pro 14',
    category: '电脑办公',
    brand: 'Apple',
    price: 14999,
    stock: 20,
    status: 'active',
    description: '专业级笔记本电脑',
  },
];

export default function ProductsShadcnPage() {
  const { t } = useStaticTranslations('admin');
  const [products, setProducts] = useState(mockProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      brand: '',
      price: 0,
      stock: 0,
      description: '',
    },
  });

  // 过滤商品
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 处理表单提交
  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      // 更新商品
      setProducts(prev =>
        prev.map(p =>
          p.id === editingProduct.id
            ? { ...p, ...data }
            : p
        )
      );
    } else {
      // 添加新商品
      const newProduct = {
        id: Date.now().toString(),
        ...data,
        status: 'active',
      };
      setProducts(prev => [...prev, newProduct]);
    }
    
    setIsDialogOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  // 编辑商品
  const handleEdit = (product: any) => {
    setEditingProduct(product);
    form.reset(product);
    setIsDialogOpen(true);
  };

  // 删除商品
  const handleDelete = (id: string) => {
    if (confirm(t('deleteConfirmContent'))) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // 添加新商品
  const handleAdd = () => {
    setEditingProduct(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('productManagement')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('manageProducts')}
        </p>
      </div>

      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('searchProducts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addProduct')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? t('editProduct') : t('addProduct')}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('productName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('enterProductName')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('categoryLabel')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('categoryPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="手机数码">{t('phoneDigital')}</SelectItem>
                            <SelectItem value="电脑办公">{t('computerOffice')}</SelectItem>
                            <SelectItem value="音频设备">{t('audioEquipment')}</SelectItem>
                            <SelectItem value="家用电器">{t('homeAppliances')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('brandLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('brandPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('price')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('enterPrice')}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('stock')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('enterStock')}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('enterDescription')}
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {t('cancel')}
                  </Button>
                  <Button type="submit">
                    {editingProduct ? t('update') : t('create')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 商品列表 */}
      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status === 'active' ? t('active') : t('inactive')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{t('category')}:</span> {product.category}
                    </div>
                    <div>
                      <span className="font-medium">{t('brand')}:</span> {product.brand}
                    </div>
                    <div>
                      <span className="font-medium">{t('price')}:</span> ¥{product.price}
                    </div>
                    <div>
                      <span className="font-medium">{t('stock')}:</span> {product.stock}
                    </div>
                  </div>
                  
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.description}
                  </p>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('noProductsFound')}</p>
        </div>
      )}
    </div>
  );
}
