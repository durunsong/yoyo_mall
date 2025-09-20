/**
 * 根页面 - 重定向到默认语言
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  // 重定向到默认语言页面
  redirect('/zh-CN');
}
