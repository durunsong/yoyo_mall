/**
 * 骨架屏组件
 * 用于显示加载状态的占位符
 */

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton-wave rounded-md border-0 shadow-none', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

// 卡片骨架屏
export function CardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

// 表格骨架屏
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 产品卡片骨架屏
export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg bg-white overflow-hidden shadow-sm">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

// 订单卡片骨架屏
export function OrderCardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between pt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  );
}

// 页面骨架屏
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* 主要内容 */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <TableSkeleton rows={8} />
        </div>
      </div>
    </div>
  );
}

// 通知列表项骨架屏
export function NotificationItemSkeleton() {
  return (
    <div className="p-4 transition-colors relative">
      <div className="flex items-start gap-4 pl-4">
        {/* 图标骨架 - 匹配实际图标容器（p-2 rounded-full，图标 h-5 w-5） */}
        <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
        
        {/* 内容骨架 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {/* 标题 */}
            <Skeleton className="h-4 w-32 mb-1" />
            
            {/* 删除按钮骨架 */}
            <Skeleton className="h-4 w-4 rounded flex-shrink-0 opacity-0" />
          </div>
          
          {/* 消息内容 - 匹配实际的两行文本 */}
          <Skeleton className="h-3.5 w-full mt-1" />
          <Skeleton className="h-3.5 w-3/4 mt-1" />
          
          {/* 时间 */}
          <Skeleton className="h-3 w-20 mt-2" />
        </div>
      </div>
    </div>
  );
}

// 通知页面骨架屏
export function NotificationsPageSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card text-card-foreground rounded-lg shadow-sm">
        {/* 头部骨架 - 匹配 CardHeader 结构（p-4），但内容使用 flex items-center justify-between */}
        <div className="p-4 shadow-sm">
          <div className="flex items-center justify-between">
            {/* 左侧：标题和徽章 */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            
            {/* 右侧：筛选按钮 - 匹配实际按钮布局 */}
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div>
        </div>

        {/* 通知列表骨架 - 匹配 CardContent p-0 和 space-y-0 结构 */}
        <div className="p-0">
          <div className="space-y-0">
            {Array.from({ length: items }).map((_, i) => {
              const isLast = i === items - 1;
              return (
                <div key={i} className={!isLast ? 'shadow-sm mb-2' : ''}>
                  <NotificationItemSkeleton />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


