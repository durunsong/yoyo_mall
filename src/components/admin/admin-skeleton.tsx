/**
 * 后台管理骨架屏组件
 * 提供不同类型的骨架屏布局，用于后台各个模块的加载状态
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Dashboard 仪表板骨架屏
 * 包含统计卡片、图表区域等
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 顶部统计卡片网格 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="skeleton-wave h-4 w-24 rounded" />
              <div className="skeleton-wave h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <div className="skeleton-wave mb-1 h-8 w-32 rounded" />
              <div className="skeleton-wave h-3 w-40 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="skeleton-wave h-5 w-32 rounded" />
            <div className="skeleton-wave h-4 w-48 rounded" />
          </CardHeader>
          <CardContent>
            <div className="skeleton-wave h-[300px] w-full rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="skeleton-wave h-5 w-32 rounded" />
            <div className="skeleton-wave h-4 w-48 rounded" />
          </CardHeader>
          <CardContent>
            <div className="skeleton-wave h-[300px] w-full rounded" />
          </CardContent>
        </Card>
      </div>

      {/* 最新订单列表 */}
      <Card>
        <CardHeader>
          <div className="skeleton-wave h-5 w-32 rounded" />
          <div className="skeleton-wave h-4 w-48 rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="skeleton-wave h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <div className="skeleton-wave h-4 w-32 rounded" />
                    <div className="skeleton-wave h-3 w-24 rounded" />
                  </div>
                </div>
                <div className="skeleton-wave h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 表格列表骨架屏
 * 用于商品列表、订单列表、用户列表等
 */
export function TableSkeleton({ rows = 10, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton-wave mb-2 h-6 w-32 rounded" />
            <div className="skeleton-wave h-4 w-48 rounded" />
          </div>
          <div className="skeleton-wave h-10 w-24 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <TableContentSkeleton rows={rows} cols={cols} />
      </CardContent>
    </Card>
  );
}

type TableContentSkeletonProps = {
  rows?: number;
  cols?: number;
  filterItems?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  firstColumnType?: 'text' | 'media';
};

export function TableContentSkeleton({
  rows = 10,
  cols = 6,
  filterItems = 2,
  showFilters = true,
  showPagination = true,
  firstColumnType = 'text',
}: TableContentSkeletonProps) {
  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="skeleton-wave h-10 flex-1 rounded" />
          {Array.from({ length: filterItems }).map((_, i) => (
            <div key={i} className="skeleton-wave h-10 w-[160px] rounded" />
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-md bg-muted/30 shadow-sm">
        <div className="flex items-center gap-4 bg-muted/40 px-4 py-3">
          <div className="skeleton-wave h-4 w-4 rounded" />
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="skeleton-wave h-4 flex-1 rounded" />
          ))}
        </div>

        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 px-4 py-3 odd:bg-muted/20"
          >
            <div className="skeleton-wave h-4 w-4 rounded" />
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1">
                {colIndex === 0 && firstColumnType === 'media' ? (
                  <div className="flex items-center gap-3">
                    <div className="skeleton-wave h-10 w-10 rounded" />
                    <div className="space-y-2">
                      <div className="skeleton-wave h-4 w-32 rounded" />
                      <div className="skeleton-wave h-3 w-24 rounded" />
                    </div>
                  </div>
                ) : (
                  <div className="skeleton-wave h-4 w-24 rounded" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showPagination && (
        <div className="mt-4 flex items-center justify-between">
          <div className="skeleton-wave h-4 w-40 rounded" />
          <div className="flex gap-2">
            <div className="skeleton-wave h-10 w-20 rounded" />
            <div className="skeleton-wave h-10 w-20 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductsPageSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(200px,240px)_1fr] xl:grid-cols-[minmax(220px,280px)_1fr]">
      <div className="space-y-4">
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="skeleton-wave mb-1 h-6 w-24 rounded" />
                <div className="skeleton-wave h-4 w-40 rounded" />
              </div>
              <div className="skeleton-wave h-8 w-20 rounded" />
            </div>
            <div className="skeleton-wave mt-3 h-8 w-full rounded" />
          </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2"
              >
                <div className="skeleton-wave h-4 w-4 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton-wave h-4 w-32 rounded" />
                  <div className="skeleton-wave h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="skeleton-wave h-8 w-40 rounded" />
            <div className="skeleton-wave h-4 w-64 rounded" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="skeleton-wave h-10 w-28 rounded" />
            <div className="skeleton-wave h-10 w-32 rounded" />
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <div className="skeleton-wave h-4 w-20 rounded" />
                <div className="skeleton-wave h-4 w-4 rounded" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="skeleton-wave h-6 w-12 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="skeleton-wave h-5 w-32 rounded" />
            <div className="skeleton-wave h-4 w-48 rounded" />
          </CardHeader>
          <CardContent>
            <TableContentSkeleton rows={8} cols={7} filterItems={2} firstColumnType="media" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function OrdersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton-wave h-8 w-36 rounded" />
        <div className="skeleton-wave mt-2 h-4 w-72 rounded" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="skeleton-wave h-4 w-20 rounded" />
              <div className="skeleton-wave h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <div className="skeleton-wave h-8 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="skeleton-wave h-5 w-32 rounded" />
          <div className="skeleton-wave h-4 w-48 rounded" />
        </CardHeader>
        <CardContent>
          <TableContentSkeleton rows={8} cols={6} filterItems={1} firstColumnType="text" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 设置页面骨架屏
 * 用于系统设置、用户设置等表单类页面
 */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="skeleton-wave mb-2 h-6 w-40 rounded" />
          <div className="skeleton-wave h-4 w-64 rounded" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton-wave h-4 w-32 rounded" />
              <div className="skeleton-wave h-10 w-full rounded" />
            </div>
          ))}
          <div className="flex gap-3">
            <div className="skeleton-wave h-10 w-24 rounded" />
            <div className="skeleton-wave h-10 w-24 rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 分析统计页面骨架屏
 * 用于数据分析、报表等页面
 */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* 时间筛选器 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="skeleton-wave h-4 w-24 rounded" />
            <div className="skeleton-wave h-10 w-48 rounded" />
            <div className="skeleton-wave h-10 w-32 rounded" />
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="skeleton-wave h-4 w-24 rounded" />
              <div className="skeleton-wave h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <div className="skeleton-wave mb-1 h-8 w-32 rounded" />
              <div className="skeleton-wave h-3 w-40 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 大图表 */}
      <Card>
        <CardHeader>
          <div className="skeleton-wave h-5 w-32 rounded" />
          <div className="skeleton-wave h-4 w-48 rounded" />
        </CardHeader>
        <CardContent>
          <div className="skeleton-wave h-[400px] w-full rounded" />
        </CardContent>
      </Card>

      {/* 双栏图表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="skeleton-wave h-5 w-32 rounded" />
              <div className="skeleton-wave h-4 w-48 rounded" />
            </CardHeader>
            <CardContent>
              <div className="skeleton-wave h-[300px] w-full rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * 订单详情页骨架屏
 * 用于订单详情页面
 */
export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* 订单头部信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="skeleton-wave h-6 w-48 rounded" />
              <div className="skeleton-wave h-4 w-32 rounded" />
            </div>
            <div className="skeleton-wave h-8 w-24 rounded-full" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 左侧主内容 */}
        <div className="space-y-6 md:col-span-2">
          {/* 订单商品 */}
          <Card>
            <CardHeader>
              <div className="skeleton-wave h-5 w-32 rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="skeleton-wave h-20 w-20 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-wave h-4 w-48 rounded" />
                    <div className="skeleton-wave h-3 w-32 rounded" />
                    <div className="skeleton-wave h-4 w-24 rounded" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 配送地址 */}
          <Card>
            <CardHeader>
              <div className="skeleton-wave h-5 w-32 rounded" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-wave h-4 w-full rounded" />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 右侧摘要 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="skeleton-wave h-5 w-32 rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="skeleton-wave h-4 w-20 rounded" />
                  <div className="skeleton-wave h-4 w-24 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="skeleton-wave h-5 w-32 rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-wave h-4 w-full rounded" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * 用户管理页面骨架屏
 * 包含统计卡片和用户列表表格
 */
export function UserManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="skeleton-wave mb-1 h-9 w-32 rounded" />
        <div className="skeleton-wave h-5 w-48 rounded" />
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="skeleton-wave h-4 w-20 rounded" />
              <div className="skeleton-wave h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <div className="skeleton-wave h-8 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 用户列表卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="skeleton-wave mb-2 h-6 w-32 rounded" />
              <div className="skeleton-wave h-4 w-48 rounded" />
            </div>
            <div className="skeleton-wave h-10 w-28 rounded" />
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="mb-6 flex gap-4">
            <div className="skeleton-wave h-10 flex-1 rounded" />
            <div className="skeleton-wave h-10 w-[150px] rounded" />
            <div className="skeleton-wave h-10 w-[150px] rounded" />
          </div>

          {/* 用户表格 */}
          <div className="rounded-md">
            {/* 表头 */}
            <div className="flex items-center gap-4 bg-gray-50 px-4 py-3">
              {['用户', '角色', '订单数', '注册时间', '操作'].map((_, i) => (
                <div
                  key={i}
                  className={`skeleton-wave h-4 rounded ${i === 0 ? 'flex-[2]' : 'flex-1'}`}
                />
              ))}
            </div>

            {/* 表格行 */}
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center gap-4 px-4 py-3"
              >
                {/* 用户信息（头像+姓名+邮箱） */}
                <div className="flex flex-[2] items-center gap-3">
                  <div className="skeleton-wave h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <div className="skeleton-wave h-4 w-32 rounded" />
                    <div className="skeleton-wave h-3 w-40 rounded" />
                  </div>
                </div>
                {/* 角色 */}
                <div className="flex-1">
                  <div className="skeleton-wave h-6 w-16 rounded-full" />
                </div>
                {/* 订单数 */}
                <div className="flex-1">
                  <div className="skeleton-wave h-6 w-10 rounded-full" />
                </div>
                {/* 注册时间 */}
                <div className="flex-1">
                  <div className="skeleton-wave h-4 w-24 rounded" />
                </div>
                {/* 操作按钮 */}
                <div className="flex flex-1 justify-end gap-2">
                  <div className="skeleton-wave h-8 w-8 rounded" />
                  <div className="skeleton-wave h-8 w-8 rounded" />
                  <div className="skeleton-wave h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="skeleton-wave h-4 w-48 rounded" />
            <div className="flex gap-2">
              <div className="skeleton-wave h-10 w-20 rounded" />
              <div className="skeleton-wave h-10 w-20 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 首页配置管理骨架屏
 * 用于首页配置拖拽编辑页面
 */
export function HomeConfigSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton-wave mb-2 h-9 w-32 rounded" />
          <div className="skeleton-wave h-5 w-64 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton-wave h-10 w-24 rounded" />
          <div className="skeleton-wave h-10 w-28 rounded" />
        </div>
      </div>

      {/* 主要内容 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：模块列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="skeleton-wave h-6 w-32 rounded" />
              <div className="skeleton-wave h-4 w-40 rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-white p-4"
                >
                  <div className="skeleton-wave h-5 w-5 rounded" />
                  <div className="flex-1">
                    <div className="skeleton-wave h-5 w-32 rounded" />
                  </div>
                  <div className="skeleton-wave h-6 w-12 rounded-full" />
                  <div className="skeleton-wave h-8 w-8 rounded" />
                  <div className="skeleton-wave h-8 w-8 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：添加模块 */}
        <div>
          <Card>
            <CardHeader>
              <div className="skeleton-wave h-6 w-24 rounded" />
              <div className="skeleton-wave h-4 w-32 rounded" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-wave h-10 w-full rounded" />
              ))}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <div className="skeleton-wave h-6 w-24 rounded" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-wave h-10 w-full rounded" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Footer配置管理骨架屏
 * 用于Footer配置页面
 */
export function FooterConfigSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="skeleton-wave mb-2 h-8 w-48 rounded" />
              <div className="skeleton-wave h-4 w-64 rounded" />
            </div>
            <div className="skeleton-wave h-10 w-28 rounded" />
          </div>
        </CardHeader>
      </Card>

      {/* 标签页导航 */}
      <div className="flex space-x-4">
        <div className="skeleton-wave h-10 w-24 rounded-t" />
        <div className="skeleton-wave h-10 w-24 rounded-t" />
        <div className="skeleton-wave h-10 w-24 rounded-t" />
      </div>

      {/* Footer区块列表卡片 */}
      <Card>
        <CardHeader>
          <div className="skeleton-wave h-6 w-40 rounded" />
          <div className="skeleton-wave h-4 w-56 rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Footer区块项 */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-card">
                {/* 区块头部 */}
                <div className="flex items-center justify-between p-4 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="skeleton-wave h-8 w-8 rounded" />
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="skeleton-wave h-5 w-32 rounded" />
                        <div className="skeleton-wave h-5 w-12 rounded-full" />
                        <div className="skeleton-wave h-5 w-16 rounded-full" />
                      </div>
                      <div className="skeleton-wave h-4 w-40 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="skeleton-wave h-9 w-24 rounded" />
                    <div className="skeleton-wave h-9 w-9 rounded" />
                    <div className="skeleton-wave h-9 w-9 rounded" />
                  </div>
                </div>

                {/* 链接列表（展开状态） */}
                {i === 0 && (
                  <div className="p-4">
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="flex items-center justify-between py-2">
                          <div className="skeleton-wave h-4 w-32 rounded" />
                          <div className="skeleton-wave h-4 w-48 rounded" />
                          <div className="skeleton-wave h-4 w-12 rounded" />
                          <div className="skeleton-wave h-5 w-12 rounded-full" />
                          <div className="flex space-x-2">
                            <div className="skeleton-wave h-8 w-8 rounded" />
                            <div className="skeleton-wave h-8 w-8 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

