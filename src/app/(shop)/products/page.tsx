/**
 * 商品列表页面
 * 前台商品展示页面
 */

import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Heart,
  ShoppingCart,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '商品列表',
  description: '浏览所有商品',
};

export default function ProductsPage() {
  // 模拟商品数据
  const products = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      price: 999.0,
      originalPrice: 1099.0,
      image: '/placeholder-product.jpg',
      rating: 4.8,
      reviews: 256,
      inStock: true,
    },
    {
      id: '2',
      name: 'MacBook Air M3',
      price: 1199.0,
      originalPrice: null,
      image: '/placeholder-product.jpg',
      rating: 4.9,
      reviews: 189,
      inStock: true,
    },
    {
      id: '3',
      name: 'AirPods Pro',
      price: 249.0,
      originalPrice: 279.0,
      image: '/placeholder-product.jpg',
      rating: 4.7,
      reviews: 432,
      inStock: false,
    },
    {
      id: '4',
      name: 'iPad Air',
      price: 599.0,
      originalPrice: null,
      image: '/placeholder-product.jpg',
      rating: 4.6,
      reviews: 123,
      inStock: true,
    },
    {
      id: '5',
      name: 'Apple Watch Series 9',
      price: 399.0,
      originalPrice: 429.0,
      image: '/placeholder-product.jpg',
      rating: 4.8,
      reviews: 298,
      inStock: true,
    },
    {
      id: '6',
      name: 'Mac mini M3',
      price: 799.0,
      originalPrice: null,
      image: '/placeholder-product.jpg',
      rating: 4.5,
      reviews: 87,
      inStock: true,
    },
  ];

  const categories = [
    '全部',
    '手机数码',
    '电脑办公',
    '家用电器',
    '服装配饰',
    '家居生活',
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">商品列表</h1>
        <p className="text-gray-600">发现您喜欢的商品</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <Input placeholder="搜索商品..." className="h-12 pl-10" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
            <Button variant="outline" size="icon">
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 侧边栏分类 */}
        <div className="flex-shrink-0 lg:w-64">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-4 font-semibold">商品分类</h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    className="block w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-gray-100"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 价格筛选 */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="mb-4 font-semibold">价格区间</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="最低价" />
                  <Input placeholder="最高价" />
                </div>
                <Button className="w-full" variant="outline">
                  应用
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 商品网格 */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">共 {products.length} 个商品</p>
            <select className="rounded-md border px-3 py-2">
              <option>默认排序</option>
              <option>价格从低到高</option>
              <option>价格从高到低</option>
              <option>评分最高</option>
              <option>最新上架</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(product => (
              <Card
                key={product.id}
                className="group transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-0">
                  {/* 商品图片 */}
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-300">
                        <span className="text-xs text-gray-500">商品图片</span>
                      </div>
                    </div>
                    {!product.inStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="font-medium text-white">暂时缺货</span>
                      </div>
                    )}
                    {product.originalPrice && (
                      <div className="absolute top-2 left-2 rounded bg-red-500 px-2 py-1 text-xs text-white">
                        特价
                      </div>
                    )}
                    <button className="absolute top-2 right-2 rounded-full bg-white p-2 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 商品信息 */}
                  <div className="p-4">
                    <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900">
                      {product.name}
                    </h3>

                    {/* 评分 */}
                    <div className="mb-2 flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating)
                                ? 'fill-current text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-1 text-sm text-gray-600">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>

                    {/* 价格 */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-blue-600">
                          ${product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <Button className="w-full" disabled={!product.inStock}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {product.inStock ? '加入购物车' : '暂时缺货'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Button variant="outline" disabled>
                上一页
              </Button>
              <Button variant="outline">1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">下一页</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
