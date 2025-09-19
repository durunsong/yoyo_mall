/**
 * 商品管理页面
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Edit, Trash2, Package } from 'lucide-react';

export const metadata: Metadata = {
  title: '商品管理',
  description: '管理商品信息',
};

export default function AdminProductsPage() {
  // 模拟商品数据
  const products = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      sku: 'IPHONE-15-PRO-128GB',
      price: 999.0,
      stock: 50,
      status: '已发布',
      image: '/placeholder-product.jpg',
    },
    {
      id: '2',
      name: 'MacBook Air M3',
      sku: 'MBA-M3-13-256GB',
      price: 1199.0,
      stock: 25,
      status: '已发布',
      image: '/placeholder-product.jpg',
    },
    {
      id: '3',
      name: 'AirPods Pro',
      sku: 'AIRPODS-PRO-3',
      price: 249.0,
      stock: 100,
      status: '草稿',
      image: '/placeholder-product.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
              <p className="text-gray-600">管理所有商品信息</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/admin">返回后台</Link>
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加商品
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 筛选和搜索 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>筛选和搜索</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input placeholder="搜索商品名称或SKU..." className="pl-10" />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                筛选
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 商品列表 */}
        <Card>
          <CardHeader>
            <CardTitle>商品列表</CardTitle>
            <CardDescription>共 {products.length} 个商品</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left">商品</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">价格</th>
                    <th className="px-4 py-3 text-left">库存</th>
                    <th className="px-4 py-3 text-left">状态</th>
                    <th className="px-4 py-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.sku}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">${product.price}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            product.stock > 20
                              ? 'text-green-600'
                              : 'text-orange-600'
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs ${
                            product.status === '已发布'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                显示 1-{products.length} 共 {products.length} 条记录
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  上一页
                </Button>
                <Button variant="outline" size="sm" disabled>
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
