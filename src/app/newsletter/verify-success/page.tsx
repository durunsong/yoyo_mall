/**
 * Newsletter 验证成功页面
 */

'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function NewsletterVerifySuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          订阅成功！
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          您的邮箱已成功验证，感谢您的订阅！
        </p>
        
        <p className="text-gray-500 mb-8 text-sm">
          我们将定期向您发送最新的优惠信息和产品资讯，敬请期待！
        </p>
        
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

