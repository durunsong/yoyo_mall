/**
 * 优化的图片组件
 * 支持WebP、懒加载、占位符等性能优化功能
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from 'antd';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  showSkeleton?: boolean;
  skeletonProps?: {
    height?: number;
    width?: number;
  };
}

// 生成低质量占位符
const generateBlurDataURL = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // 创建渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

// 检查WebP支持
const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 85,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  className = '',
  objectFit = 'cover',
  sizes,
  onLoad,
  onError,
  fallbackSrc,
  showSkeleton = true,
  skeletonProps,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [webPSupported, setWebPSupported] = useState<boolean | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 检查WebP支持
  useEffect(() => {
    checkWebPSupport().then(setWebPSupported);
  }, []);

  // 处理图片加载完成
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // 处理图片加载错误
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
    
    onError?.();
  };

  // 生成优化的图片URL
  const getOptimizedSrc = (originalSrc: string): string => {
    // 如果是外部URL，直接返回
    if (originalSrc.startsWith('http') && !originalSrc.includes(window.location.hostname)) {
      return originalSrc;
    }

    // 对于内部URL，可以添加查询参数进行优化
    const url = new URL(originalSrc, window.location.origin);
    
    // 如果支持WebP，添加format参数
    if (webPSupported && !originalSrc.includes('.svg')) {
      url.searchParams.set('format', 'webp');
    }
    
    // 添加质量参数
    if (quality < 100) {
      url.searchParams.set('quality', quality.toString());
    }
    
    return url.toString();
  };

  // 生成动态blurDataURL
  const dynamicBlurDataURL = blurDataURL || (
    typeof window !== 'undefined' ? generateBlurDataURL(width, height) : undefined
  );

  // 如果显示骨架屏
  if (showSkeleton && isLoading && !hasError) {
    return (
      <Skeleton.Image
        style={{
          width: skeletonProps?.width || width,
          height: skeletonProps?.height || height,
        }}
        className={className}
      />
    );
  }

  // 如果有错误且没有fallback
  if (hasError && (!fallbackSrc || currentSrc === fallbackSrc)) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const optimizedSrc = webPSupported !== null ? getOptimizedSrc(currentSrc) : currentSrc;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      <Image
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={dynamicBlurDataURL}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          objectFit,
          width: '100%',
          height: '100%',
        }}
      />
      
      {/* 加载状态覆盖层 */}
      {isLoading && !showSkeleton && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

// 预设的响应式尺寸配置
export const responsiveSizes = {
  small: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  medium: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  large: '(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw',
  full: '100vw',
};

// 预设的质量配置
export const qualityPresets = {
  low: 60,
  medium: 75,
  high: 85,
  ultra: 95,
};

// 导出类型
export type { OptimizedImageProps };
