/**
 * 404页面组件
 * 当用户访问不存在的页面时显示
 */

'use client';

import Link from 'next/link';
import { Button, Result } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <div className="space-x-4">
            <Button type="primary" icon={<HomeOutlined />}>
              <Link href="/">返回首页</Link>
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
              返回上一页
            </Button>
          </div>
        }
      />
    </div>
  );
}
