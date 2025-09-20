/**
 * 数据分析页面
 */

import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '数据分析 - 管理后台',
  description: '查看销售数据和分析报表',
};

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">数据分析</h1>
        <p className="text-gray-600 mt-1">查看销售数据和分析报表</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>销售报表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>数据分析功能正在开发中...</p>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
