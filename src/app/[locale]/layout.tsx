/**
 * 语言特定的布局组件
 * 由于我们使用自定义的 i18n 系统，这里只需要简单地渲染子组件
 */

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // 等待 params（Next.js 15 要求）
  const { locale } = await params;

  // 我们的 i18n 系统在客户端组件中处理语言切换
  // 这里只需要渲染子组件
  return <>{children}</>;
}
