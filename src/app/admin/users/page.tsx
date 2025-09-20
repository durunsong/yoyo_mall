/**
 * 用户管理页面
 */

import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '用户管理 - 管理后台',
  description: '管理用户信息',
};

export default function UsersPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600 mt-1">管理所有用户账户</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>用户管理功能正在开发中...</p>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
