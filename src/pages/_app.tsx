import type { AppProps } from 'next/app';

/** Pages Router 兼容入口；业务页面统一使用 App Router。 */
export default function LegacyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
