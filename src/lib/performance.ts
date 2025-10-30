/**
 * 性能监控工具
 * 用于监控和优化应用性能
 */

/**
 * 性能指标类型
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  
  // 自定义指标
  pageLoadTime?: number;
  apiResponseTime?: number;
}

/**
 * 监控 Core Web Vitals
 */
export function reportWebVitals(metric: any) {
  // 在生产环境中，可以将这些指标发送到分析服务
  // 例如: Google Analytics, Vercel Analytics 等
  
  if (process.env.NODE_ENV === 'production') {
    const { name, value, id, rating } = metric;
    
    console.log({
      metric: name,
      value: Math.round(value),
      id,
      rating,
    });

    // 发送到分析服务
    // Example: Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        value: Math.round(value),
        metric_id: id,
        metric_rating: rating,
      });
    }
  }
}

/**
 * 测量函数执行时间
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * 测量异步函数执行时间
 */
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * 懒加载图片
 */
export function lazyLoadImage(img: HTMLImageElement) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          const src = image.dataset.src;
          if (src) {
            image.src = src;
            image.removeAttribute('data-src');
            observer.unobserve(image);
          }
        }
      });
    },
    {
      rootMargin: '50px',
    },
  );

  observer.observe(img);
}

/**
 * 预加载关键资源
 */
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * 预连接到第三方域名
 */
export function preconnect(url: string) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * DNS 预取
 */
export function dnsPrefetch(url: string) {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * 获取页面性能指标
 */
export function getPagePerformance(): PerformanceMetrics | null {
  if (typeof window === 'undefined') return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) return null;

  return {
    pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
    TTFB: navigation.responseStart - navigation.requestStart,
  };
}

/**
 * 监控 API 请求性能
 */
export class APIPerformanceMonitor {
  private static requests = new Map<string, number>();

  static start(url: string) {
    this.requests.set(url, performance.now());
  }

  static end(url: string) {
    const startTime = this.requests.get(url);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.requests.delete(url);

      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 API ${url}: ${duration.toFixed(2)}ms`);
      }

      // 记录慢请求 (超过3秒)
      if (duration > 3000) {
        console.warn(`⚠️ Slow API request: ${url} took ${duration.toFixed(2)}ms`);
      }

      return duration;
    }
    return null;
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 内存使用监控
 */
export function getMemoryUsage() {
  if (typeof window !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
}

/**
 * 页面可见性监控
 */
export function onPageVisibilityChange(callback: (isVisible: boolean) => void) {
  if (typeof document === 'undefined') return;

  const handleVisibilityChange = () => {
    callback(!document.hidden);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}




