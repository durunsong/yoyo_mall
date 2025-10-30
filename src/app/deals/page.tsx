/**
 * 优惠活动页面
 * 展示所有促销商品和优惠活动
 */

'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingDown, Percent } from 'lucide-react';
import { useStaticTranslations } from '@/hooks/use-i18n';
import ProductCard from '@/components/products/product-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  image?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  featured?: boolean;
}

export default function DealsPage() {
  const { t } = useStaticTranslations('common');
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        // 获取有对比价格的商品（促销商品）
        const response = await fetch('/api/products?hasDiscount=true&limit=20');
        const data = await response.json();
        if (data.success) {
          setProducts(data.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.images?.[0]?.url,
            rating: p.rating || 0,
            reviews: p.reviewCount || 0,
            inStock: p.inventory ? p.inventory.quantity > 0 : true,
            featured: p.isFeatured,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // 添加到购物车
  const handleAddToCart = (product: { id: string; name: string; price: number; image?: string }) => {
    addItem({
      productId: product.id,
      quantity: 1,
      price: product.price,
      name: product.name,
      image: product.image || '/placeholder.png',
    });
    toast.success('已添加到购物车');
  };

  // 添加到心愿单
  const handleAddToWishlist = async (productId: string) => {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('已添加到心愿单');
      } else {
        toast.error(data.message || '添加失败');
      }
    } catch (error) {
      console.error('Add to wishlist failed:', error);
      toast.error('添加失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Banner */}
        <div className="mb-8 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <TrendingDown className="h-8 w-8" />
                <h1 className="text-3xl font-bold">
                  {t('deals') || '优惠活动'}
                </h1>
              </div>
              <p className="text-lg text-red-100">
                精选优惠商品，超值折扣等你来抢！
              </p>
            </div>
            <div className="hidden md:block">
              <Badge variant="secondary" className="bg-white px-6 py-3 text-2xl font-bold text-red-600">
                <Percent className="mr-2 h-6 w-6" />
                限时特惠
              </Badge>
            </div>
          </div>
        </div>

        {/* 优惠统计 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">促销商品</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{products.length}</div>
              <p className="text-xs text-gray-600">个商品正在促销</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">平均折扣</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {products.length > 0
                  ? Math.round(
                      products
                        .filter(p => p.comparePrice && p.comparePrice > p.price)
                        .reduce((sum, p) => sum + ((p.comparePrice! - p.price) / p.comparePrice!) * 100, 0) /
                        products.filter(p => p.comparePrice && p.comparePrice > p.price).length,
                    )
                  : 0}%
              </div>
              <p className="text-xs text-gray-600">OFF</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">最高折扣</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {products.length > 0
                  ? Math.max(
                      ...products
                        .filter(p => p.comparePrice && p.comparePrice > p.price)
                        .map(p => Math.round(((p.comparePrice! - p.price) / p.comparePrice!) * 100)),
                    )
                  : 0}%
              </div>
              <p className="text-xs text-gray-600">OFF</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">可节省金额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ¥{products
                  .filter(p => p.comparePrice && p.comparePrice > p.price)
                  .reduce((sum, p) => sum + (p.comparePrice! - p.price), 0)
                  .toFixed(0)}
              </div>
              <p className="text-xs text-gray-600">最高可省</p>
            </CardContent>
          </Card>
        </div>

        {/* 商品列表 - 5列布局 */}
        {products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mb-4 text-4xl text-gray-300">🎁</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              暂无优惠活动
            </h3>
            <p className="text-gray-600">
              目前还没有促销商品，敬请期待！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

