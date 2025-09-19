/**
 * Loading组件
 * 用于显示加载状态的组件集合
 */

import { cn } from '@/lib/utils';

// Spinner组件Props接口
interface SpinnerProps {
  /** 大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

/**
 * Spinner组件 - 旋转加载指示器
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">加载中...</span>
    </div>
  );
}

// LoadingScreen组件Props接口
interface LoadingScreenProps {
  /** 加载文本 */
  text?: string;
  /** 是否显示背景遮罩 */
  overlay?: boolean;
}

/**
 * LoadingScreen组件 - 全屏加载状态
 */
export function LoadingScreen({ text = '加载中...', overlay = true }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center z-50',
        overlay && 'bg-black/50 backdrop-blur-sm',
      )}
    >
      <div className="flex flex-col items-center space-y-4 bg-white p-8 rounded-lg shadow-lg">
        <Spinner size="lg" />
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
}

// LoadingButton组件Props接口
interface LoadingButtonProps {
  /** 是否正在加载 */
  loading: boolean;
  /** 按钮内容 */
  children: React.ReactNode;
  /** 加载时显示的文本 */
  loadingText?: string;
  /** 自定义类名 */
  className?: string;
  /** 其他按钮属性 */
  [key: string]: any;
}

/**
 * LoadingButton组件 - 带加载状态的按钮
 */
export function LoadingButton({
  loading,
  children,
  loadingText = '加载中...',
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        className,
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// SkeletonProps接口
interface SkeletonProps {
  /** 自定义类名 */
  className?: string;
  /** 是否显示动画 */
  animate?: boolean;
}

/**
 * Skeleton组件 - 骨架屏加载状态
 */
export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 rounded-md',
        animate && 'animate-pulse',
        className,
      )}
    />
  );
}

/**
 * ProductCardSkeleton组件 - 商品卡片骨架屏
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <Skeleton className="w-full h-48" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

/**
 * PageLoader组件 - 页面级加载组件
 */
export function PageLoader({ text = '页面加载中...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  );
}

/**
 * InlineLoader组件 - 行内加载组件
 */
export function InlineLoader({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2 text-gray-600">
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
