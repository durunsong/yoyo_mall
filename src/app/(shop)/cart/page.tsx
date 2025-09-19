/**
 * 购物车页面
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag,
  ArrowLeft,
  Tag
} from 'lucide-react';

export const metadata: Metadata = {
  title: '购物车',
  description: '查看购物车中的商品',
};

export default function CartPage() {
  // 模拟购物车数据
  const cartItems = [
    {
      id: '1',
      productId: '1',
      name: 'iPhone 15 Pro',
      price: 999.00,
      quantity: 1,
      image: '/placeholder-product.jpg',
      attributes: [
        { name: '颜色', value: '深空黑色' },
        { name: '容量', value: '128GB' },
      ],
    },
    {
      id: '2',
      productId: '2',
      name: 'AirPods Pro',
      price: 249.00,
      quantity: 2,
      image: '/placeholder-product.jpg',
      attributes: [],
    },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 0; // 免费配送
  const tax = subtotal * 0.08; // 8% 税率
  const total = subtotal + shipping + tax;

  const isEmpty = cartItems.length === 0;

  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">购物车为空</h1>
          <p className="text-gray-600 mb-6">
            还没有添加任何商品，去看看有什么好东西吧！
          </p>
          <Button asChild>
            <Link href="/products">开始购物</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">购物车</h1>
        </div>
        <p className="text-gray-600">共 {cartItems.length} 件商品</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 购物车商品列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>商品清单</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
                  {/* 商品图片 */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-500 text-xs">商品图片</span>
                  </div>

                  {/* 商品信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    {item.attributes.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {item.attributes.map((attr, index) => (
                          <p key={index} className="text-sm text-gray-600">
                            {attr.name}: {attr.value}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      ${item.price}
                    </p>
                  </div>

                  {/* 数量控制 */}
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon">
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* 删除按钮 */}
                  <Button variant="outline" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 优惠券 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>优惠券</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input placeholder="输入优惠券代码" />
                </div>
                <Button>
                  <Tag className="w-4 h-4 mr-2" />
                  使用
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 订单摘要 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>订单摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>商品小计</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>运费</span>
                <span className="text-green-600">
                  {shipping === 0 ? '免费' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>税费</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>总计</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button className="w-full" size="lg" asChild>
                  <Link href="/checkout">
                    立即结算
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/products">
                    继续购物
                  </Link>
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600 pt-4">
                <p>满$99免运费</p>
                <p>支持7天无理由退货</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
