/**
 * 订单管理页面
 */

import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '订单管理 - 管理后台',
  description: '管理订单信息',
};

export default function OrdersPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
        <p className="text-gray-600 mt-1">处理和跟踪所有订单</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>订单管理功能正在开发中...</p>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
