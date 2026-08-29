/**
 * 根页面 - 重定向到默认语言
 */

import { redirect } from 'next/navigation';
import { getSystemSettings } from '@/lib/server/system-settings';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const { defaultLanguage } = await getSystemSettings();

  // 重定向到默认语言页面
  redirect(`/${defaultLanguage}`);
}
