/**
 * 语言特定的布局组件
 * 由于我们使用自定义的 i18n 系统，这里只需要简单地渲染子组件
 */

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<unknown>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // 动态段由 Next 传入，当前布局只负责渲染子页面。
  await params;

  // 我们的 i18n 系统在客户端组件中处理语言切换
  // 这里只需要渲染子组件
  return <>{children}</>;
}
