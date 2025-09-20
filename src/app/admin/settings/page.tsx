/**
 * 系统设置页面
 */

import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '系统设置 - 管理后台',
  description: '配置系统参数',
};

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
        <p className="text-gray-600 mt-1">配置系统参数和选项</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>系统配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>系统设置功能正在开发中...</p>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
