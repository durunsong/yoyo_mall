/**
 * Newsletter 验证失败页面
 */

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';

function VerifyErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams?.get('reason');

  const getErrorMessage = () => {
    switch (reason) {
      case 'missing_token':
        return '缺少验证令牌，请检查邮件链接是否完整。';
      case 'invalid_token':
        return '验证令牌无效或已过期，请重新订阅。';
      case 'server_error':
        return '服务器错误，请稍后重试。';
      default:
        return '验证失败，请重新订阅或联系客服。';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="w-20 h-20 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          验证失败
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {getErrorMessage()}
        </p>
        
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            返回首页重新订阅
          </Link>
          
          <Link
            href="/contact"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            联系客服
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NewsletterVerifyErrorPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <VerifyErrorContent />
    </Suspense>
  );
}

