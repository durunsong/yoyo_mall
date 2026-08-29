import Document, { Head, Html, Main, NextScript } from 'next/document';

/** Pages Router 兼容 Document；业务页面统一使用 App Router。 */
export default class LegacyDocument extends Document {
  render() {
    return (
      <Html lang="zh-CN">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
