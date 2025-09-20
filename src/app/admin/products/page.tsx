/**
 * 商品管理页面
 */

import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: '商品管理 - 管理后台',
  description: '管理商品信息',
};

export default function ProductsPage() {
  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">商品管理</h1>
          <p className="text-gray-600 mt-1">管理所有商品信息</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加商品
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>商品列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>商品管理功能正在开发中...</p>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
