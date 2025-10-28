/**
 * 商品详情页面
 * 展示商品详细信息、图片、规格选择、评论等
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Share2,
  Star,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import ProductCard from '@/components/products/product-card';
import { ProductReviews } from '@/components/products/product-reviews';

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
  images: { id: string; url: string; alt: string }[];
  category: { id: string; name: string };
  brand?: { id: string; name: string };
  inventory?: { quantity: number };
  reviews?: any[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useStaticTranslations('product');
  const { t: tCommon } = useStaticTranslations('common');
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // 获取商品详情
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${params.id}`);
        const data = await response.json();

        if (data.success) {
          setProduct(data.data);
          // 获取相关商品
          if (data.data.category?.id) {
            fetchRelatedProducts(data.data.category.id, data.data.id);
          }
        } else {
          toast.error(t('productNotFound') || 'Product not found');
          router.push('/products');
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error(t('loadFailed') || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router, t]);

  // 获取相关商品
  const fetchRelatedProducts = async (categoryId: string, productId: string) => {
    try {
      const response = await fetch(
        `/api/products?category=${categoryId}&limit=4`
      );
      const data = await response.json();
      if (data.success) {
        // 过滤掉当前商品
        const filtered = data.data.filter((p: any) => p.id !== productId);
        setRelatedProducts(filtered.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    }
  };

  // 添加到购物车
  const handleAddToCart = async () => {
    if (!product) return;

    try {
      // 构造完整的购物车项目
      addItem({
        productId: product.id,
        quantity: quantity,
        price: product.price,
        name: product.name,
        image: product.images[0]?.url || '/placeholder.png',
      });
      toast.success(t('addedToCart') || 'Added to cart successfully!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error(t('addToCartFailed') || 'Failed to add to cart');
    }
  };

  // 数量增减
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.inventory?.quantity || 999)) {
      setQuantity(newQuantity);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-lg bg-gray-200" />
          <div className="space-y-4">
            <div className="h-8 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-12 w-1/3 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // 计算折扣百分比
  const discountPercent = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  // 库存状态
  const inStock = (product.inventory?.quantity || 0) > 0;
  const lowStock = (product.inventory?.quantity || 0) <= 10 && (product.inventory?.quantity || 0) > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            {tCommon('home')}
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gray-900">
            {tCommon('products')}
          </Link>
          <span>/</span>
          <Link
            href={`/products?category=${product.category.id}`}
            className="hover:text-gray-900"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* 商品主要信息 */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 左侧：图片画廊 */}
          <div className="space-y-4">
            {/* 主图 */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={product.images[selectedImage]?.url || 'https://via.placeholder.com/800'}
                alt={product.images[selectedImage]?.alt || product.name}
                fill
                className="object-cover"
                priority
              />
              {discountPercent > 0 && (
                <Badge variant="destructive" className="absolute left-4 top-4">
                  -{discountPercent}%
                </Badge>
              )}
            </div>

            {/* 缩略图 */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-20 w-20 overflow-hidden rounded-md border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-blue-600'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.url || 'https://via.placeholder.com/80'}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：商品信息 */}
          <div className="space-y-6">
            {/* 品牌 */}
            {product.brand && (
              <div className="text-sm text-gray-600">
                {t('brand') || 'Brand'}: <span className="font-medium">{product.brand.name}</span>
              </div>
            )}

            {/* 标题 */}
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600">{product.shortDesc}</p>
            </div>

            {/* 评分 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                4.5 (128 {t('reviews') || 'reviews'})
              </span>
            </div>

            <Separator />

            {/* 价格 */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-blue-600">
                  ${product.price.toFixed(2)}
                </span>
                {product.comparePrice && (
                  <span className="text-xl text-gray-400 line-through">
                    ${product.comparePrice.toFixed(2)}
                  </span>
                )}
              </div>
              {lowStock && (
                <p className="text-sm text-orange-600">
                  ⚠️ {t('lowStock') || 'Only'} {product.inventory?.quantity}{' '}
                  {t('itemsLeft') || 'items left'}
                </p>
              )}
            </div>

            {/* 库存状态 */}
            <div className="flex items-center gap-2">
              {inStock ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {t('inStock') || 'In Stock'}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-red-600">
                  {t('outOfStock') || 'Out of Stock'}
                </span>
              )}
            </div>

            <Separator />

            {/* 数量选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('quantity') || 'Quantity'}:</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md border">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.inventory?.quantity || 0)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-gray-600">
                  {product.inventory?.quantity || 0} {t('available') || 'available'}
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t('addToCart') || 'Add to Cart'}
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* 保障信息 */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{t('freeShipping') || 'Free Shipping'}</p>
                      <p className="text-sm text-gray-600">
                        {t('freeShippingDesc') || 'On orders over $99'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{t('securePayment') || 'Secure Payment'}</p>
                      <p className="text-sm text-gray-600">
                        {t('securePaymentDesc') || '100% secure transaction'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{t('easyReturns') || 'Easy Returns'}</p>
                      <p className="text-sm text-gray-600">
                        {t('easyReturnsDesc') || '7 days return policy'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 商品详细信息标签页 */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">
                {t('description') || 'Description'}
              </TabsTrigger>
              <TabsTrigger value="specifications">
                {t('specifications') || 'Specifications'}
              </TabsTrigger>
              <TabsTrigger value="reviews">
                {t('reviews') || 'Reviews'} (128)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="prose max-w-none p-6">
                  <p className="text-gray-700">{product.description}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-gray-900">SKU</dt>
                      <dd className="mt-1 text-gray-600">{product.sku}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">
                        {t('category') || 'Category'}
                      </dt>
                      <dd className="mt-1 text-gray-600">{product.category.name}</dd>
                    </div>
                    {product.brand && (
                      <div>
                        <dt className="font-medium text-gray-900">
                          {t('brand') || 'Brand'}
                        </dt>
                        <dd className="mt-1 text-gray-600">{product.brand.name}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ProductReviews productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* 相关商品 */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('relatedProducts') || 'Related Products'}
              </h2>
              <p className="text-gray-600">
                {t('relatedProductsDesc') || 'You may also like these products'}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
