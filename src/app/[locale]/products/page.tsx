/**
 * 商品列表页面
 * 前台商品展示页面 - 支持国际化
 */

'use client';

import { useTranslations } from 'next-intl';
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
  ShoppingCart
} from 'lucide-react';


export default function ProductsPage() {
  const t = useTranslations('products');
  const common = useTranslations('common');
  // 模拟商品数据
  const products = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      price: 999.00,
      originalPrice: 1099.00,
      image: '/placeholder-product.jpg',
      rating: 4.8,
      reviews: 256,
      inStock: true,
    },
    {
      id: '2',
      name: 'MacBook Air M3',
      price: 1199.00,
      originalPrice: null,
      image: '/placeholder-product.jpg',
      rating: 4.9,
      reviews: 189,
      inStock: true,
    },
    {
      id: '3',
      name: 'AirPods Pro',
      price: 249.00,
      originalPrice: 279.00,
      image: '/placeholder-product.jpg',
      rating: 4.7,
      reviews: 432,
      inStock: false,
    },
    {
      id: '4',
      name: 'iPad Air',
      price: 599.00,
      originalPrice: null,
      image: '/placeholder-product.jpg',
      rating: 4.6,
      reviews: 123,
      inStock: true,
    },
    {
      id: '5',
      name: 'Apple Watch Series 9',
      price: 399.00,
      originalPrice: 429.00,
      image: '/placeholder-product.jpg',
      rating: 4.8,
      reviews: 298,
      inStock: true,
    },
    {
      id: '6',
      name: 'Mac mini M3',
      price: 799.00,
      originalPrice: null,
      image: '/placeholder-product.jpg',
      rating: 4.5,
      reviews: 87,
      inStock: true,
    },
  ];

  const categories = [
    { key: 'all', label: t('categories.all') },
    { key: 'mobile', label: t('categories.mobile') },
    { key: 'computer', label: t('categories.computer') },
    { key: 'appliances', label: t('categories.appliances') },
    { key: 'clothing', label: t('categories.clothing') },
    { key: 'home', label: t('categories.home') },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder={t('searchPlaceholder')}
                className="pl-10 h-12"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              {common('filter')}
            </Button>
            <Button variant="outline" size="icon">
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 侧边栏分类 */}
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">商品分类</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 价格筛选 */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">{t('priceRange')}</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder={t('minPrice')} />
                  <Input placeholder={t('maxPrice')} />
                </div>
                <Button className="w-full" variant="outline">{t('apply')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 商品网格 */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">{t('totalProducts', { count: products.length })}</p>
            <select className="border rounded-md px-3 py-2">
              <option>{t('sortBy.default')}</option>
              <option>{t('sortBy.priceLowToHigh')}</option>
              <option>{t('sortBy.priceHighToLow')}</option>
              <option>{t('sortBy.ratingHighest')}</option>
              <option>{t('sortBy.newest')}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* 商品图片 */}
                  <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-xs">商品图片</span>
                      </div>
                    </div>
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">{t('outOfStock')}</span>
                      </div>
                    )}
                    {product.originalPrice && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                        {t('sale')}
                      </div>
                    )}
                    <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 商品信息 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {/* 评分 */}
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-1">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>

                    {/* 价格 */}
                    <div className="flex items-center justify-between mb-3">
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
                    <Button 
                      className="w-full" 
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.inStock ? t('addToCart') : t('outOfStock')}
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
              <Button variant="outline">
                下一页
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
