'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useAuthModal } from '@/hooks/use-auth-modal';
import ProductCard from '@/components/products/product-card';
import { ProductReviews } from '@/components/products/product-reviews';
import { ShareMenu } from '@/components/common/share-menu';
import { getCurrencySymbol } from '@/hooks/use-system-settings';
import { createTranslator, type TranslationDictionary } from '@/lib/i18n/dictionary';
import type { HomepageProduct, ProductDetailData } from '@/types/product';
import type { SystemSettings } from '@/lib/settings/system-settings';

const PLACEHOLDER_IMAGE =
  'https://next-static-oss.oss-cn-shanghai.aliyuncs.com/placeholder.png';

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

interface ProductDetailClientProps {
  product: ProductDetailData;
  relatedProducts: HomepageProduct[];
  settings: SystemSettings;
  translations: {
    product: TranslationDictionary;
    common: TranslationDictionary;
  };
  shareUrl: string;
  sessionUser: Session['user'] | null;
}

export function ProductDetailClient({
  product,
  relatedProducts,
  settings,
  translations,
  shareUrl,
  sessionUser,
}: ProductDetailClientProps) {
  const tProduct = useMemo(() => createTranslator(translations.product), [translations.product]);
  const tCommon = useMemo(() => createTranslator(translations.common), [translations.common]);
  const { data: session } = useSession();
  const effectiveSessionUser = session?.user ?? sessionUser;
  const { addItem } = useCartStore();
  const wishlistItems = useWishlistStore((state) => state.items);
  const addWishlistItem = useWishlistStore((state) => state.addItem);
  const removeWishlistItem = useWishlistStore((state) => state.removeItem);
  const { openModal } = useAuthModal();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [shareLink, setShareLink] = useState(shareUrl);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [prevImageIndex, setPrevImageIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredThumbnail, setHoveredThumbnail] = useState<number | null>(null);
  const [hoveredPreviewIndex, setHoveredPreviewIndex] = useState<number | null>(null);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);

  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const thumbnailListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareLink(window.location.href);
    }
  }, []);

  useEffect(() => {
    thumbnailRefs.current = [];
  }, [product.id]);

  const imageList =
    product.images && product.images.length > 0
      ? product.images
      : [{ id: 'placeholder', url: PLACEHOLDER_IMAGE, alt: product.name, sortOrder: 0 }];

  const totalImages = imageList.length;

  useEffect(() => {
    if (totalImages === 0) return;
    if (selectedImage >= totalImages) {
      setSelectedImage(0);
      setPreviewIndex(0);
    }
  }, [selectedImage, totalImages]);

  useEffect(() => {
    const currentThumbnail = thumbnailRefs.current[selectedImage];
    if (currentThumbnail) {
      currentThumbnail.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedImage]);

  useEffect(() => {
    if (!isAnimating) return;
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setPrevImageIndex(null);
    }, 300);
    return () => clearTimeout(timer);
  }, [isAnimating]);

  const goToImage = useCallback(
    (index: number, direction: 'left' | 'right' = 'left', animate = true) => {
      if (totalImages === 0) return;
      const normalized = ((index % totalImages) + totalImages) % totalImages;
      if (normalized === selectedImage) return;

      if (animate) {
        setSlideDirection(direction);
        setPrevImageIndex(selectedImage);
        setIsAnimating(true);
      } else {
        setPrevImageIndex(null);
        setIsAnimating(false);
      }

      setSelectedImage(normalized);
      setPreviewIndex(normalized);
    },
    [selectedImage, totalImages],
  );

  const handlePrevImage = useCallback(() => {
    if (totalImages > 1) {
      goToImage(selectedImage - 1, 'right');
    }
  }, [goToImage, selectedImage, totalImages]);

  const handleNextImage = useCallback(() => {
    if (totalImages > 1) {
      goToImage(selectedImage + 1, 'left');
    }
  }, [goToImage, selectedImage, totalImages]);

  const scrollThumbnails = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    const container = thumbnailListRef.current;
    if (!container) return;
    const scrollAmount = 120 * 3;
    if (direction === 'up' || direction === 'down') {
      container.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    } else {
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleThumbnailHover = useCallback(
    (index: number) => {
      setHoveredThumbnail(index);
      if (index === selectedImage) return;
      const direction = index > selectedImage ? 'left' : 'right';
      goToImage(index, direction);
    },
    [goToImage, selectedImage],
  );

  const handleThumbnailLeave = useCallback(() => {
    setHoveredThumbnail(null);
  }, []);

  const handleOpenPreview = useCallback(
    (index: number) => {
      goToImage(index, index > selectedImage ? 'left' : 'right', false);
      setPreviewOpen(true);
    },
    [goToImage, selectedImage],
  );

  const handlePreviewPrev = useCallback(() => {
    goToImage(previewIndex - 1, 'right');
  }, [goToImage, previewIndex]);

  const handlePreviewNext = useCallback(() => {
    goToImage(previewIndex + 1, 'left');
  }, [goToImage, previewIndex]);

  const primaryImage = imageList[selectedImage] ?? imageList[0];
  const primaryImageUrl = primaryImage?.url || PLACEHOLDER_IMAGE;
  const primaryImageAlt = primaryImage?.alt || product.name;
  const showMainNav = totalImages > 2;
  const showThumbnailNav = totalImages > 4;

  const recommendationLimit = settings.productDetailConfig.recommendations.limit;
  const recommendationsEnabled = settings.productDetailConfig.recommendations.enabled;
  const shareConfig = settings.productDetailConfig.share;
  const reviewsConfig = settings.productDetailConfig.reviews;
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);
  const availableQuantity = product.availableQuantity ?? product.inventory?.quantity ?? 0;
  const lowStockThreshold = product.inventory?.lowStockThreshold ?? 10;
  const inStock = product.inStock ?? (availableQuantity > 0 || product.allowOutOfStock);
  const lowStock =
    product.isLowStock ?? (availableQuantity > 0 && availableQuantity <= lowStockThreshold);
  const clampedRating = Math.max(0, Math.min(5, product.averageRating));
  const hasReviews = product.reviewCount > 0;

  const fallbackShareUrl =
    shareLink ||
    shareUrl ||
    (settings.siteUrl
      ? `${settings.siteUrl.replace(/\/$/, '')}/products/${product.id}`
      : '');

  const handleAddToCart = async () => {
    if (!inStock) return;
    if (!effectiveSessionUser) {
      openModal('login');
      toast.info(tProduct('addToCartLogin') || '请先登录后再添加到购物车');
      return;
    }
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });
      const data = await response.json();
      if (data.success) {
        const imageUrl =
          product.images?.[selectedImage]?.url || product.images?.[0]?.url || PLACEHOLDER_IMAGE;
        addItem({
          productId: product.id,
          quantity,
          price: product.price,
          name: product.name,
          image: imageUrl,
        });
        toast.success(tProduct('addedToCart') || '已添加到购物车');
      } else {
        toast.error(data.message || tProduct('addToCartFailed') || '添加失败');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error(tProduct('addToCartFailed') || '添加失败');
    }
  };

  const handleToggleWishlist = async () => {
    if (!effectiveSessionUser) {
      openModal('login');
      toast.info(tProduct('wishlistLogin') || '请先登录后再添加到心愿单');
      return;
    }

    const existingItem = wishlistItems.find((item) => item.productId === product.id);
    try {
      setWishlistLoading(true);
      if (existingItem) {
        const response = await fetch(`/api/wishlist/${existingItem.id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (response.ok && data.success) {
          removeWishlistItem(existingItem.id);
          toast.success(tProduct('wishlistRemoved') || '已从心愿单移除');
        } else {
          toast.error(data.error || tProduct('wishlistFailed') || '操作失败');
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
            product.images?.[selectedImage]?.url || product.images?.[0]?.url || PLACEHOLDER_IMAGE;
          addWishlistItem({
            id: wishlistItem?.id,
            productId: product.id,
            name: product.name,
            price: Number(product.price ?? 0),
            image: imageUrl,
            addedAt: wishlistItem?.createdAt ? new Date(wishlistItem.createdAt) : undefined,
          });
          toast.success(tProduct('wishlistAdded') || '已加入心愿单');
        } else {
          toast.error(data.error || tProduct('wishlistFailed') || '操作失败');
        }
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error);
      toast.error(tProduct('operationFailed') || '操作失败，请稍后重试');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleRelatedAddToCart = async (item: HomepageProduct) => {
    if (!effectiveSessionUser) {
      openModal('login');
      toast.info(tProduct('addToCartLogin') || '请先登录后再添加到购物车');
      return;
    }
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.id, quantity: 1 }),
      });
      const data = await response.json();
      if (data.success) {
        addItem({
          productId: item.id,
          quantity: 1,
          price: item.price,
          name: item.name,
          image: item.image || item.images?.[0]?.url || PLACEHOLDER_IMAGE,
        });
        toast.success(tProduct('addedToCart') || '已添加到购物车');
      } else {
        toast.error(data.message || '添加失败');
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      toast.error('添加失败，请重试');
    }
  };

  const handleRelatedWishlist = async (productId: string) => {
    if (!effectiveSessionUser) {
      openModal('login');
      toast.info(tProduct('wishlistLogin') || '请先登录后再添加到心愿单');
      return;
    }

    const existingItem = wishlistItems.find((item) => item.productId === productId);
    try {
      setWishlistLoadingId(productId);
      if (existingItem) {
        const response = await fetch(`/api/wishlist/${existingItem.id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (response.ok && data.success) {
          removeWishlistItem(existingItem.id);
          toast.success(tProduct('wishlistRemoved') || '已从心愿单移除');
        } else {
          toast.error(data.error || '操作失败');
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          const wishlistItem = data.data;
          const relProduct = relatedProducts.find((item) => item.id === productId);
          const imageUrl =
            relProduct?.images?.[0]?.url ||
            (relProduct as any)?.image ||
            wishlistItem?.product?.images?.[0]?.url ||
            PLACEHOLDER_IMAGE;
          addWishlistItem({
            id: wishlistItem?.id,
            productId,
            name: relProduct?.name ?? '',
            price: Number(relProduct?.price ?? 0),
            image: imageUrl,
            addedAt: wishlistItem?.createdAt ? new Date(wishlistItem.createdAt) : undefined,
          });
          toast.success(tProduct('wishlistAdded') || '已加入心愿单');
        } else {
          toast.error(data.error || '操作失败');
        }
      }
    } catch (error) {
      console.error('心愿单操作失败:', error);
      toast.error('操作失败，请稍后重试');
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (product.allowOutOfStock) {
      setQuantity((prev) => Math.max(1, Math.min(999, prev + delta)));
      return;
    }
    const currentAvailable =
      product.availableQuantity ?? product.inventory?.quantity ?? 0;
    const newQuantity = quantity + delta;
    if (newQuantity < 1) return;
    if (currentAvailable === 0) return;
    if (newQuantity <= currentAvailable) {
      setQuantity(newQuantity);
    }
  };

  const currentWishlistItem = wishlistItems.find((item) => item.productId === product.id);
  const isWishlisted = Boolean(currentWishlistItem);
  const recommendationsConfig = settings.productDetailConfig.recommendations;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
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

        <div className="lg:flex lg:gap-8">
          <div className="lg:w-1/2 lg:shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="hidden md:flex gap-4">
                {totalImages > 1 && (
                  <div className="relative flex flex-col">
                    <div
                      ref={thumbnailListRef}
                      className="flex max-h-[500px] w-[80px] flex-col gap-2 overflow-y-auto scrollbar-thin"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#d1d5db transparent',
                      }}
                    >
                      {imageList.map((image, index) => (
                        <button
                          key={image.id ?? `${product.id}-image-${index}`}
                          ref={(el) => {
                            thumbnailRefs.current[index] = el;
                          }}
                          type="button"
                          onClick={() => {
                            if (index === selectedImage) return;
                            const direction = index > selectedImage ? 'left' : 'right';
                            goToImage(index, direction);
                          }}
                          onMouseEnter={() => handleThumbnailHover(index)}
                          onMouseLeave={handleThumbnailLeave}
                          className="relative h-[80px] w-[80px] shrink-0 overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black cursor-pointer"
                          style={{
                            border:
                              selectedImage === index
                                ? '2px solid #000'
                                : hoveredThumbnail === index
                                  ? '2px solid rgba(0,0,0,0.5)'
                                  : '2px solid #e5e7eb',
                          }}
                        >
                          <Image
                            src={image.url || PLACEHOLDER_IMAGE}
                            alt={image.alt || `${product.name} ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <span className="sr-only">{tProduct('previewImage') || '预览图片'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(selectedImage)}
                      className="relative aspect-square w-full overflow-hidden bg-gray-100 focus:outline-none cursor-zoom-in"
                    >
                      {prevImageIndex !== null && isAnimating && (
                        <Image
                          key={`prev-${prevImageIndex}-${slideDirection}`}
                          src={imageList[prevImageIndex]?.url || PLACEHOLDER_IMAGE}
                          alt={imageList[prevImageIndex]?.alt || product.name}
                          fill
                          className={`absolute inset-0 object-cover ${
                            slideDirection === 'left'
                              ? 'animate-product-slide-out-left'
                              : 'animate-product-slide-out-right'
                          }`}
                          priority
                        />
                      )}
                      <Image
                        key={`main-${selectedImage}`}
                        src={primaryImageUrl}
                        alt={primaryImageAlt}
                        fill
                        className={`absolute inset-0 object-cover ${
                          isAnimating
                            ? slideDirection === 'left'
                              ? 'animate-product-slide-in-left'
                              : 'animate-product-slide-in-right'
                            : ''
                        }`}
                        priority
                      />
                      <span className="sr-only">{tProduct('previewImage') || '预览图片'}</span>
                      {product.comparePrice && (
                        <Badge variant="destructive" className="absolute left-4 top-4 z-10">
                          -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                        </Badge>
                      )}
                    </button>

                    {showMainNav && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow hover:bg-white transition-all"
                          aria-label={tProduct('previousImage') || '上一张'}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow hover:bg-white transition-all"
                          aria-label={tProduct('nextImage') || '下一张'}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:hidden space-y-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(selectedImage)}
                    className="relative aspect-square w-full overflow-hidden bg-gray-100 focus:outline-none"
                  >
                    {prevImageIndex !== null && isAnimating && (
                      <Image
                        key={`prev-${prevImageIndex}-${slideDirection}`}
                        src={imageList[prevImageIndex]?.url || PLACEHOLDER_IMAGE}
                        alt={imageList[prevImageIndex]?.alt || product.name}
                        fill
                        className={`absolute inset-0 object-cover ${
                          slideDirection === 'left'
                            ? 'animate-product-slide-out-left'
                            : 'animate-product-slide-out-right'
                        }`}
                        priority
                      />
                    )}
                    <Image
                      key={`main-${selectedImage}`}
                      src={primaryImageUrl}
                      alt={primaryImageAlt}
                      fill
                      className={`absolute inset-0 object-cover ${
                        isAnimating
                          ? slideDirection === 'left'
                            ? 'animate-product-slide-in-left'
                            : 'animate-product-slide-in-right'
                          : ''
                      }`}
                      priority
                    />
                    <span className="sr-only">{tProduct('previewImage') || '预览图片'}</span>
                    {product.comparePrice && (
                      <Badge variant="destructive" className="absolute left-4 top-4 z-10">
                        -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                      </Badge>
                    )}
                  </button>

                  {showMainNav && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow hover:bg-white"
                        aria-label={tProduct('previousImage') || '上一张'}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow hover:bg-white"
                        aria-label={tProduct('nextImage') || '下一张'}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {totalImages > 1 && (
                  <div className="relative">
                    {showThumbnailNav && (
                      <>
                        <button
                          type="button"
                          onClick={() => scrollThumbnails('left')}
                          className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white"
                          aria-label={tProduct('scrollLeft') || '向左滚动'}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollThumbnails('right')}
                        className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white"
                          aria-label={tProduct('scrollRight') || '向右滚动'}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    <div
                      className={`flex gap-2 overflow-x-auto scrollbar-thin ${showThumbnailNav ? 'px-10' : ''}`}
                    >
                      {imageList.map((image, index) => (
                        <button
                          key={image.id ?? `${product.id}-image-${index}`}
                          type="button"
                          onClick={() => {
                            if (index === selectedImage) return;
                            const direction = index > selectedImage ? 'left' : 'right';
                            goToImage(index, direction);
                          }}
                          onMouseEnter={() => handleThumbnailHover(index)}
                          onMouseLeave={handleThumbnailLeave}
                          className="relative h-20 w-20 shrink-0 overflow-hidden transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                          style={{
                            border:
                              selectedImage === index
                                ? '3px solid #000'
                                : hoveredThumbnail === index
                                  ? '3px solid rgba(0,0,0,0.5)'
                                  : '3px solid transparent',
                          }}
                        >
                          <Image
                            src={image.url || PLACEHOLDER_IMAGE}
                            alt={image.alt || `${product.name} ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <span className="sr-only">{tProduct('previewImage') || '预览图片'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0 lg:w-1/2 space-y-6">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600">{product.shortDesc}</p>
              {product.tags && product.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 shadow-sm"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {hasReviews ? (
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
                  {`${clampedRating.toFixed(1)} / 5（${product.reviewCount} ${tProduct('reviews') || 'reviews'}）`}
                </span>
                {clampedRating > 0 && (
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-yellow-100 text-xs font-semibold text-yellow-700 shadow-sm"
                  >
                    {(tProduct('reviewHeat') || '热度')} {Math.round((clampedRating / 5) * 100)}%
                  </Badge>
                )}
              </div>
            ) : null}

            <Separator />

            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-blue-600">
                  {currencySymbol}
                  {Number(product.price).toFixed(2)}
                </span>
                {product.comparePrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {currencySymbol}
                    {Number(product.comparePrice).toFixed(2)}
                  </span>
                )}
              </div>
              {lowStock && (
                <p className="text-sm text-orange-600">
                  ⚠️ {tProduct('lowStock') || 'Only'} {availableQuantity}{' '}
                  {tProduct('itemsLeft') || 'items left'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-md bg-white p-3 shadow-sm">
              {inStock ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {tProduct('inStock') || 'In Stock'}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-red-600">
                  {tProduct('outOfStock') || 'Out of Stock'}
                </span>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">{tProduct('quantity') || 'Quantity'}:</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md bg-white shadow-sm">
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
                      !product.allowOutOfStock &&
                      (availableQuantity === 0 || quantity >= availableQuantity)
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-gray-600">
                  {product.allowOutOfStock
                    ? tProduct('preorderHint') || '可预订，下单后优先为您安排备货'
                    : `${availableQuantity} ${tProduct('available') || 'available'}`}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {tProduct('addToCart') || 'Add to Cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                aria-pressed={isWishlisted}
                className={`transition-colors ${
                  isWishlisted ? 'ring-1 ring-red-200 bg-red-50 text-red-600' : 'shadow-sm'
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
                description={product.shortDesc || ''}
                image={primaryImageUrl}
                trigger={
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 p-0"
                    aria-label={tProduct('share') || '分享'}
                  >
                    <ShareButtonIcon className="h-5 w-5" />
                  </Button>
                }
                messages={{
                  defaultShareLabel: tProduct('share') || '分享',
                  copySuccess: tProduct('shareCopySuccess') || '链接已复制到剪贴板',
                  copyFailed: tProduct('shareCopyFailed') || '复制失败，请手动复制',
                }}
              />
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{tProduct('freeShipping') || 'Free Shipping'}</p>
                      <p className="text-sm text-gray-600">
                        {tProduct('freeShippingDesc') || 'On orders over $99'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{tProduct('securePayment') || 'Secure Payment'}</p>
                      <p className="text-sm text-gray-600">
                        {tProduct('securePaymentDesc') || '100% secure transaction'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{tProduct('easyReturns') || 'Easy Returns'}</p>
                      <p className="text-sm text-gray-600">
                        {tProduct('easyReturnsDesc') || '7 days return policy'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Tabs defaultValue="description">
                <TabsList>
                  <TabsTrigger value="description">
                    {tProduct('description') || 'Description'}
                  </TabsTrigger>
                  <TabsTrigger value="specifications">
                    {tProduct('specifications') || 'Specifications'}
                  </TabsTrigger>
                  {reviewsConfig.enabled && (
                    <TabsTrigger value="reviews">
                      {tProduct('reviews') || 'Reviews'}（{product.reviewCount}）
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
                            {tProduct('category') || 'Category'}
                          </dt>
                          <dd className="mt-1 text-gray-600">{product.category.name}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </TabsContent>

                {reviewsConfig.enabled && (
                  <TabsContent value="reviews" className="mt-6">
                    {hasReviews ? (
                      <ProductReviews productId={product.id} />
                    ) : (
                      <Card>
                        <CardContent className="p-6 text-sm text-gray-500">
                          {tProduct('noReviewsYet') || '该商品暂时没有评价'}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </div>

        {recommendationsEnabled && relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {recommendationsConfig.title || tProduct('relatedProducts') || 'Related Products'}
              </h2>
              <p className="text-gray-600">
                {recommendationsConfig.subtitle ||
                  tProduct('relatedProductsDesc') ||
                  'You may also like these products'}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onAddToCart={handleRelatedAddToCart}
                  onAddToWishlist={handleRelatedWishlist}
                  isWishlisted={wishlistItems.some((item) => item.productId === relProduct.id)}
                  wishlistLoading={wishlistLoadingId === relProduct.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="h-screen w-screen max-w-none overflow-hidden border-none bg-transparent p-0 shadow-none [&>button[data-radix-dialog-close]]:hidden">
          <DialogTitle className="sr-only">
            {tProduct('previewImage') || '预览图片'}
          </DialogTitle>

          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-6 top-6 z-50 text-white transition-all hover:scale-110 hover:opacity-80 focus:outline-none"
            aria-label={tCommon('close') || 'Close'}
          >
            <X className="h-8 w-8" strokeWidth={2} />
          </button>

          <div className="flex h-full flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6">
            <div className="flex max-h-[100px] shrink-0 flex-row gap-2 overflow-x-auto sm:max-h-full sm:w-28 sm:flex-col sm:overflow-y-auto">
              {imageList.map((image, index) => (
                <button
                  key={`preview-${image.id ?? index}`}
                  type="button"
                  onClick={() => {
                    if (index === selectedImage) return;
                    const direction = index > selectedImage ? 'left' : 'right';
                    goToImage(index, direction);
                  }}
                  onMouseEnter={() => setHoveredPreviewIndex(index)}
                  onMouseLeave={() => setHoveredPreviewIndex(null)}
                  className="relative h-20 w-20 shrink-0 overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{
                    border:
                      previewIndex === index
                        ? '3px solid #fff'
                        : hoveredPreviewIndex === index
                          ? '3px solid rgba(255,255,255,0.6)'
                          : '3px solid transparent',
                  }}
                >
                  <Image
                    src={image.url || PLACEHOLDER_IMAGE}
                    alt={image.alt || `${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <span className="sr-only">{tProduct('previewImage') || '预览图片'}</span>
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <div className="relative h-full w-full overflow-hidden bg-transparent">
                <Image
                  key={`preview-main-${previewIndex}`}
                  src={imageList[previewIndex]?.url || PLACEHOLDER_IMAGE}
                  alt={imageList[previewIndex]?.alt || product.name}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {totalImages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePreviewPrev}
                    className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
                    aria-label={tProduct('previousImage') || '上一张'}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewNext}
                    className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
                    aria-label={tProduct('nextImage') || '下一张'}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


