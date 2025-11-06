/**
 * 商品详情页面
 * 展示商品详细信息、图片、规格选择、评论等
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Star,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
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
import { useAuthModal } from '@/hooks/use-auth-modal';
import { toast } from 'sonner';
import ProductCard from '@/components/products/product-card';
import { ProductReviews } from '@/components/products/product-reviews';
import { useSystemSettings, getCurrencySymbol } from '@/hooks/use-system-settings';
import { ShareMenu } from '@/components/common/share-menu';
import { useWishlistStore } from '@/store/wishlist-store';

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
  inventory?: { quantity: number; lowStockThreshold?: number };
  reviews?: any[];
  tags?: string[];
  averageRating?: number;
  reviewCount?: number;
  availableQuantity?: number;
  inStock?: boolean;
  isLowStock?: boolean;
  allowOutOfStock?: boolean;
}

const PLACEHOLDER_IMAGE =
  'https://next-static-oss.oss-cn-shanghai.aliyuncs.com/placeholder.png';

// 使用静态资源 public/icons/share.svg 作为分享按钮图标
const ShareButtonIcon = ({ className }: { className?: string }) => (
  <img
    src="/icons/share.svg"
    alt="share"
    width={20}
    height={20}
    className={className}
    style={{ width: 20, height: 20, display: 'inline-block' }}
    loading="lazy"
    decoding="async"
  />
);

export default function ProductDetailPage() {
  const params = useParams();
  const routeProductId = (params as any)?.id as string | undefined;
  const router = useRouter();
  const { t } = useStaticTranslations('product');
  const { t: tCommon } = useStaticTranslations('common');
  const { addItem } = useCartStore();
  const { data: session } = useSession();
  const { openModal } = useAuthModal();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const wishlistItems = useWishlistStore(state => state.items);
  const addWishlistItem = useWishlistStore(state => state.addItem);
  const removeWishlistItem = useWishlistStore(state => state.removeItem);
  
  // 获取系统设置的货币符号
  const { settings } = useSystemSettings();
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);
  // 后台配置：控制推荐商品数量与是否展示
  const recommendationLimit = settings.productDetailConfig.recommendations.limit;
  const recommendationsEnabled = settings.productDetailConfig.recommendations.enabled;

  // 获取商品详情
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${routeProductId}`);
        const data = await response.json();

        if (data.success) {
          setProduct(data.data);
          setSelectedImage(0);
          // 获取相关商品
          if (data.data.category?.id && recommendationsEnabled) {
            fetchRelatedProducts(
              data.data.category.id,
              data.data.id,
              recommendationLimit,
            );
          } else {
            setRelatedProducts([]);
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

    if (routeProductId) {
      fetchProduct();
    }
  }, [routeProductId, router, t, recommendationLimit, recommendationsEnabled]);

  // 监听当前页面 URL，用于分享链接
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  // 获取相关商品
  const fetchRelatedProducts = async (
    categoryId: string,
    productId: string,
    limit: number,
  ) => {
    try {
      const response = await fetch(
        `/api/products?category=${categoryId}&limit=${limit}`,
      );
      const data = await response.json();
      if (data.success) {
        // 过滤掉当前商品
        const filtered = data.data.filter((p: any) => p.id !== productId);
        setRelatedProducts(filtered.slice(0, limit));
      }
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    }
  };

  // 添加到购物车 - 未登录时弹出登录框
  const handleAddToCart = async () => {
    if (!product) return;

    // 检查登录状态
    if (!session?.user) {
      openModal('login');
      toast.info('请先登录后再添加到购物车');
      return;
    }

    try {
      // 调用API添加到服务端购物车
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 同时添加到本地store（用于UI显示）
        const imageUrl =
          product.images?.[selectedImage]?.url ||
          product.images?.[0]?.url ||
          PLACEHOLDER_IMAGE;
        addItem({
          productId: product.id,
          quantity: quantity,
          price: product.price,
          name: product.name,
          image: imageUrl,
        });
        toast.success(t('addedToCart') || 'Added to cart successfully!');
      } else {
        toast.error(data.message || t('addToCartFailed') || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error(t('addToCartFailed') || 'Failed to add to cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    if (!session?.user) {
      openModal('login');
      toast.info('请先登录后再添加到心愿单');
      return;
    }

    const existingItem = wishlistItems.find(
      item => item.productId === product.id,
    );

    try {
      setWishlistLoading(true);

      if (existingItem) {
        const response = await fetch(`/api/wishlist/${existingItem.id}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (response.ok && data.success) {
          removeWishlistItem(existingItem.id);
          toast.success('已从心愿单移除');
        } else {
          toast.error(data.error || '移除心愿单失败');
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const wishlistItem = data.data;
          const imageUrl =
            product.images?.[selectedImage]?.url ||
            product.images?.[0]?.url ||
            PLACEHOLDER_IMAGE;

          addWishlistItem({
            id: wishlistItem?.id,
            productId: product.id,
            name: product.name,
            price: Number(product.price ?? 0),
            image: imageUrl,
            addedAt: wishlistItem?.createdAt
              ? new Date(wishlistItem.createdAt)
              : undefined,
          });

          toast.success('已加入心愿单');
        } else {
          toast.error(data.error || '加入心愿单失败');
        }
      }
    } catch (error) {
      console.error('心愿单操作失败:', error);
      toast.error('操作失败，请稍后重试');
    } finally {
      setWishlistLoading(false);
    }
  };

  // 数量增减
  const handleQuantityChange = (delta: number) => {
    if (!product) return;

    // 兼容库存追踪与允许超卖两种模式
    const currentAvailable =
      product.availableQuantity ?? product.inventory?.quantity ?? 0;
    const newQuantity = quantity + delta;
    if (newQuantity < 1) return;

    if (product?.allowOutOfStock) {
      setQuantity(Math.min(newQuantity, 999));
      return;
    }

    if (currentAvailable === 0) {
      return;
    }

    if (newQuantity <= currentAvailable) {
      setQuantity(newQuantity);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* 左侧：主图与缩略图骨架 */}
          <div className="space-y-4">
            <div className="aspect-square animate-pulse rounded-lg bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-20 w-20 animate-pulse rounded-md bg-gray-200" />
              <div className="h-20 w-20 animate-pulse rounded-md bg-gray-200" />
              <div className="h-20 w-20 animate-pulse rounded-md bg-gray-200" />
              <div className="h-20 w-20 animate-pulse rounded-md bg-gray-200" />
            </div>
          </div>

          {/* 右侧：信息骨架，尽可能还原最终布局占位 */}
          <div className="space-y-6">
            {/* 标题与短描述 */}
            <div className="space-y-3">
              <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
            </div>

            {/* 评分与标签 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
            </div>

            {/* 价格与划线价 */}
            <div className="space-y-2">
              <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
            </div>

            {/* 库存状态 */}
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />

            {/* 数量步进器 */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-32 animate-pulse rounded-md bg-gray-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            </div>

            {/* 操作按钮：加入购物车 / 心愿单 / 分享 */}
            <div className="flex gap-3">
              <div className="h-11 flex-1 animate-pulse rounded-md bg-gray-200" />
              <div className="h-11 w-11 animate-pulse rounded-md bg-gray-200" />
              <div className="h-11 w-11 animate-pulse rounded-md bg-gray-200" />
            </div>

            {/* 保障信息卡片 */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

const primaryImageUrl =
  product.images?.[selectedImage]?.url ||
  product.images?.[0]?.url ||
  PLACEHOLDER_IMAGE;
const primaryImageAlt =
  product.images?.[selectedImage]?.alt || product.name;
const currentWishlistItem = wishlistItems.find(
  item => item.productId === product.id,
);
const isWishlisted = Boolean(currentWishlistItem);

  // 计算折扣百分比
  const discountPercent = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  // 库存、评价、分享等辅助信息（后台可统一配置）
  const availableQuantity =
    product.availableQuantity ?? product.inventory?.quantity ?? 0;
  const lowStockThreshold = product.inventory?.lowStockThreshold ?? 10;
  const inStock = product.inStock ?? (availableQuantity > 0 || product.allowOutOfStock);
  const lowStock =
    product.isLowStock ??
    (availableQuantity > 0 && availableQuantity <= lowStockThreshold);
  const ratingValue = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? product.reviews?.length ?? 0;
  const shareConfig = settings.productDetailConfig.share;
  const reviewsConfig = settings.productDetailConfig.reviews;
  const recommendationsConfig = settings.productDetailConfig.recommendations;
  const fallbackShareUrl =
    shareUrl ||
    (settings.siteUrl
      ? `${settings.siteUrl.replace(/\/$/, '')}/products/${product.slug}`
      : '');
  const clampedRating = Math.max(0, Math.min(5, ratingValue));

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
                src={primaryImageUrl}
                alt={primaryImageAlt}
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
            {/* 标题 */}
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600">{product.shortDesc}</p>
              {/* 商品标签，来自后台 tags 配置 */}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full border-transparent bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 评分 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      clampedRating >= i + 1
                        ? 'fill-yellow-400 text-yellow-400'
                        : clampedRating > i
                          ? 'fill-yellow-200 text-yellow-300'
                          : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {clampedRating > 0 ? `${clampedRating.toFixed(1)} / 5` : '暂无评分'}
                {`（${reviewCount} ${t('reviews') || 'reviews'}）`}
              </span>
              {clampedRating > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-full border-transparent bg-yellow-100 text-xs font-semibold text-yellow-700"
                >
                  {(t('reviewHeat') || '热度')} {Math.round((clampedRating / 5) * 100)}%
                </Badge>
              )}
            </div>

            <Separator />

            {/* 价格 */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-blue-600">
                  {currencySymbol}{Number(product.price).toFixed(2)}
                </span>
                {product.comparePrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {currencySymbol}{Number(product.comparePrice).toFixed(2)}
                  </span>
                )}
              </div>
              {lowStock && (
                <p className="text-sm text-orange-600">
                  ⚠️ {t('lowStock') || 'Only'} {availableQuantity}{' '}
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
                    disabled={
                      !product?.allowOutOfStock &&
                      (availableQuantity === 0 || quantity >= availableQuantity)
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-gray-600">
                  {product.allowOutOfStock
                    ? t('preorderHint') || '可预订，下单后优先为您安排备货'
                    : `${availableQuantity} ${t('available') || 'available'}`}
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
              <Button
                size="lg"
                variant="outline"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                aria-pressed={isWishlisted}
                className={`transition-colors ${
                  isWishlisted ? 'border-red-200 bg-red-50 text-red-600' : ''
                }`}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`}
                />
              </Button>
              <ShareMenu
                shareConfig={shareConfig}
                url={fallbackShareUrl}
                title={product.name}
                description={product.shortDesc}
                image={primaryImageUrl}
                trigger={
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 p-0"
                    aria-label={t('share') || '分享'}
                  >
                    <ShareButtonIcon className="h-5 w-5" />
                  </Button>
                }
                messages={{
                  defaultShareLabel: t('share') || '分享',
                  copySuccess: t('shareCopySuccess') || '链接已复制到剪贴板',
                  copyFailed: t('shareCopyFailed') || '复制失败，请手动复制',
                }}
              />
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
              {reviewsConfig.enabled && (
                <TabsTrigger value="reviews">
                  {t('reviews') || 'Reviews'}（{reviewCount}）
                </TabsTrigger>
              )}
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
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            {reviewsConfig.enabled && (
              <TabsContent value="reviews" className="mt-6">
                <ProductReviews productId={product.id} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* 相关商品 */}
        {recommendationsConfig.enabled && relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {recommendationsConfig.title || t('relatedProducts') || 'Related Products'}
              </h2>
              <p className="text-gray-600">
                {recommendationsConfig.subtitle ||
                  t('relatedProductsDesc') ||
                  'You may also like these products'}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
