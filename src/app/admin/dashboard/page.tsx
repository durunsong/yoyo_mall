/**
 * 管理后台 - Dashboard 页面
 * 重定向到主 Analytics 页面
 */

import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Dashboard 实际上就是 analytics 页面
  redirect('/admin/analytics');
}

