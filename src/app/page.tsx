/**
 * 根页面 - 重定向到默认语言
 */

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function RootPage() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'global' },
    select: { defaultLanguage: true },
  });

  const defaultLanguage = settings?.defaultLanguage || 'en-US';

  // 重定向到默认语言页面
  redirect(`/${defaultLanguage}`);
}
