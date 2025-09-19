/**
 * 404页面组件
 * 当用户访问不存在的页面时显示
 */

'use client';

import Link from 'next/link';
import { Button, Result } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useStaticTranslations } from '@/hooks/use-translations';

export default function NotFound() {
  const { t } = useStaticTranslations('error');

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Result
        status="404"
        title="404"
        subTitle={t('pageNotFoundMessage')}
        extra={
          <div className="space-x-4">
            <Button type="primary" icon={<HomeOutlined />}>
              <Link href="/">{t('goHome')}</Link>
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
              {t('goBack')}
            </Button>
          </div>
        }
      />
    </div>
  );
}
