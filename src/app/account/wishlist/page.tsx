/**
 * 心愿单页面
 * 展示用户收藏的商品列表
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart-store';
import Image from 'next/image';
import Link from 'next/link';

// 心愿单项类型
interface WishlistItem {
  id: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    images: Array<{
      url: string;
      alt: string | null;
    }>;
    inventory: {
      quantity: number;
    } | null;
    category: {
      name: string;
    };
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addItem } = useCartStore();

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // 检查登录状态
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 加载心愿单
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wishlist');
      const data = await response.json();

      if (data.success) {
        setWishlistItems(data.data);
      } else {
        toast.error(data.error || '加载失败');
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWishlist();
    }
  }, [status]);

  // 移除商品
  const handleRemove = async (itemId: string) => {
    try {
      setRemovingIds((prev) => new Set(prev).add(itemId));

      const response = await fetch(`/api/wishlist/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('已移除');
        fetchWishlist();
      } else {
        toast.error(data.error || '移除失败');
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast.error('移除失败');
    } finally {
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // 添加到购物车
  const handleAddToCart = async (item: WishlistItem) => {
    try {
      const inStock = item.product.inventory && item.product.inventory.quantity > 0;
      
      if (!inStock) {
        toast.error('商品已售罄');
        return;
      }

      // 构造完整的购物车项目
      addItem({
        productId: item.product.id,
        quantity: 1,
        price: parseFloat(item.product.price.toString()),
        name: item.product.name,
        image: item.product.images?.[0]?.url || '/placeholder.png',
      });

      toast.success('已添加到购物车');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('添加失败');
    }
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(price);
  };

  // 计算折扣
  const getDiscount = (price: number, comparePrice: number | null) => {
    if (!comparePrice || comparePrice <= price) return null;
    const discount = ((comparePrice - price) / comparePrice) * 100;
    return Math.round(discount);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">我的心愿单</h1>
        <p className="text-gray-600 mt-1">
          {wishlistItems.length} 件心仪的商品
        </p>
      </div>

      {/* 心愿单列表 */}
      {wishlistItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              心愿单是空的
            </h3>
            <p className="mt-2 text-gray-500">
              浏览商品时点击心形图标，将喜欢的商品加入心愿单
            </p>
            <Button className="mt-6" onClick={() => router.push('/products')}>
              去逛逛
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistItems.map((item) => {
            const inStock = item.product.inventory && item.product.inventory.quantity > 0;
            const discount = getDiscount(item.product.price, item.product.comparePrice);

            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative">
                  {/* 商品图片 */}
                  <Link href={`/products/${item.product.id}`}>
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          width={300}
                          height={300}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-gray-400">暂无图片</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* 移除按钮 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white shadow-md hover:bg-red-50"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingIds.has(item.id)}
                  >
                    {removingIds.has(item.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>

                  {/* 折扣标签 */}
                  {discount && (
                    <Badge
                      variant="destructive"
                      className="absolute top-2 left-2"
                    >
                      -{discount}%
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* 商品信息 */}
                  <Link href={`/products/${item.product.id}`}>
                    <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-blue-600">
                      {item.product.name}
                    </h3>
                  </Link>

                  <p className="mt-1 text-sm text-gray-500">
                    {item.product.category.name}
                  </p>

                  {/* 价格 */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(item.product.price)}
                    </span>
                    {item.product.comparePrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(item.product.comparePrice)}
                      </span>
                    )}
                  </div>

                  {/* 库存状态 */}
                  <div className="mt-2">
                    {inStock ? (
                      <Badge variant="secondary" className="text-xs">
                        有货
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        已售罄
                      </Badge>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleAddToCart(item)}
                    disabled={!inStock}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    加入购物车
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 继续购物 */}
      {wishlistItems.length > 0 && (
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => router.push('/products')}>
            继续购物
          </Button>
        </div>
      )}
    </div>
  );
}

