/**
 * Next.js App组件
 * 配置next-i18next
 */

import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { RootProviders } from '@/components/providers/root-providers';
import '../app/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RootProviders>
      <Component {...pageProps} />
    </RootProviders>
  );
}

export default appWithTranslation(MyApp);
