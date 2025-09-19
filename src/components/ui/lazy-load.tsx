/**
 * 懒加载组件
 * 支持组件级别的代码分割和延迟加载
 */

'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { Spin, Alert } from 'antd';

interface LazyLoadProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  delay?: number;
  children: React.ReactNode;
}

interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  delay?: number;
  retryCount?: number;
  [key: string]: any;
}

// 错误边界组件
class LazyErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert
          message="组件加载失败"
          description="抱歉，该组件无法正常加载。请刷新页面重试。"
          type="error"
          showIcon
          action={
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
            >
              重试
            </button>
          }
        />
      );
    }

    return this.props.children;
  }
}

// 默认加载中组件
const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Spin size="large" tip="正在加载..." />
  </div>
);

// 基础懒加载组件
export function LazyLoad({
  children,
  fallback = <DefaultFallback />,
  errorFallback,
  delay = 0,
}: LazyLoadProps) {
  const [showContent, setShowContent] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!showContent) {
    return <>{fallback}</>;
  }

  return (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
}

// 动态组件加载器
export function LazyComponent({
  loader,
  fallback = <DefaultFallback />,
  errorFallback,
  delay = 0,
  retryCount = 3,
  ...props
}: LazyComponentProps) {
  const [loadAttempt, setLoadAttempt] = React.useState(0);
  
  // 创建带重试机制的加载器
  const retryLoader = React.useCallback(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        const result = await loader();
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Lazy loading attempt ${attempt + 1} failed:`, error);
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw lastError;
  }, [loader, retryCount]);

  // 动态创建懒加载组件
  const LazyComponentMemo = React.useMemo(() => {
    return lazy(retryLoader);
  }, [retryLoader, loadAttempt]);

  const handleRetry = () => {
    setLoadAttempt(prev => prev + 1);
  };

  const customErrorFallback = errorFallback || (
    <Alert
      message="组件加载失败"
      description={`组件加载失败，已重试 ${retryCount} 次。请检查网络连接后重试。`}
      type="error"
      showIcon
      action={
        <button
          onClick={handleRetry}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
        >
          重新加载
        </button>
      }
    />
  );

  return (
    <LazyLoad
      fallback={fallback}
      errorFallback={customErrorFallback}
      delay={delay}
    >
      <LazyComponentMemo {...props} />
    </LazyLoad>
  );
}

// 预定义的常用懒加载组件
export const LazyDashboard = () => (
  <LazyComponent
    loader={() => import('@/app/admin/dashboard/page')}
    fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }
  />
);

export const LazyProductList = () => (
  <LazyComponent
    loader={() => import('@/app/[locale]/products/page')}
    fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }
  />
);

export const LazyCart = () => (
  <LazyComponent
    loader={() => import('@/app/[locale]/cart/page')}
    fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }
  />
);

// 工具函数：创建自定义懒加载组件
export function createLazyComponent<T = any>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    delay?: number;
    retryCount?: number;
  } = {}
) {
  return (props: T) => (
    <LazyComponent
      loader={loader}
      {...options}
      {...props}
    />
  );
}

// Hook：检测组件是否在视口中（可用于进一步优化懒加载）
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

// 视口懒加载组件
export function ViewportLazyLoad({
  children,
  fallback = <DefaultFallback />,
  rootMargin = '100px',
  threshold = 0.1,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { rootMargin, threshold });
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    if (isVisible && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isVisible, hasLoaded]);

  return (
    <div ref={ref}>
      {hasLoaded ? children : fallback}
    </div>
  );
}
