import Link from 'next/link';

const pageTitles = {
  about: '关于 Yobuy',
  contact: '联系我们',
  careers: '加入我们',
  news: 'Yobuy 动态',
  help: '帮助中心',
  support: '服务保障',
  shipping: '配送说明',
  returns: '退换货政策',
  faq: '常见问题',
  terms: '服务条款',
  privacy: '隐私政策',
  cookies: 'Cookie 政策',
  disclaimer: '免责声明',
} as const;

export type StoreInfoSlug = keyof typeof pageTitles;

export function StoreInfoPage({ slug }: { slug: StoreInfoSlug }) {
  return (
    <main className="bg-muted/30">
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <article className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
          <header className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {pageTitles[slug]}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              本页面入口已开放，正式内容由 Yobuy 运营团队配置后发布。
            </p>
          </header>

          <section className="mt-10 border-t pt-8">
            <h2 className="text-lg font-semibold text-foreground">需要帮助？</h2>
            <p className="mt-2 leading-7 text-muted-foreground">
              在正式内容发布前，请通过 support@yoyomall.com 联系客服，并附上订单号或商品链接（如适用）。
            </p>
          </section>

          <footer className="mt-10 border-t pt-6">
            <Link
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              href="/products"
            >
              返回商品列表
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
