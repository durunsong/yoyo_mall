/**
 * Newsletter 取消订阅成功页面
 */

'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function NewsletterUnsubscribeSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-gray-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          已取消订阅
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          我们很遗憾看到您离开，感谢您之前的关注。
        </p>
        
        <p className="text-gray-500 mb-8 text-sm">
          如果这是误操作，您可以随时在我们的网站重新订阅。
        </p>
        
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

