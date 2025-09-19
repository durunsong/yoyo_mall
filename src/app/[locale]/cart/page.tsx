/**
 * 购物车页面
 * 显示用户购物车内容，支持数量修改和结算
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Row,
  Col,
  Card,
  Button,
  InputNumber,
  Typography,
  Space,
  Divider,
  Empty,
  Spin,
  Tag,
  Popconfirm,
  message,
  Breadcrumb,
  Alert
} from 'antd';
import {
  DeleteOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  HomeOutlined,
  PlusOutlined,
  MinusOutlined
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useCartApi } from '@/hooks/use-cart-api';

const { Title, Text } = Typography;

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { 
    cart, 
    loading, 
    error, 
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCartApi();

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // 如果用户未登录
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Alert
            message="请先登录"
            description="登录后可以查看和管理您的购物车"
            type="info"
            showIcon
            action={
              <Space direction="vertical">
                <Link href="/login">
                  <Button type="primary" size="small">
                    立即登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="small">注册新账户</Button>
                </Link>
              </Space>
            }
          />
        </div>
      </div>
    );
  }

  // 加载中状态
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <Spin size="large" tip="加载购物车..." />
        </div>
      </div>
    );
  }

  // 处理数量更新
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    setUpdatingItems(prev => new Set([...prev, itemId]));
    await updateQuantity(itemId, newQuantity);
    setUpdatingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  // 处理删除商品
  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set([...prev, itemId]));
    await removeItem(itemId);
    setUpdatingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  // 处理清空购物车
  const handleClearCart = async () => {
    const success = await clearCart();
    if (success) {
      message.success('购物车已清空');
    }
  };

  // 格式化价格
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  // 购物车为空
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item>
            <Link href="/">
              <HomeOutlined /> 首页
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>购物车</Breadcrumb.Item>
        </Breadcrumb>

        <div className="max-w-md mx-auto text-center">
          <Empty
            image="/images/empty-cart.svg"
            imageStyle={{ height: 200 }}
            description={
              <div>
                <Title level={4}>购物车为空</Title>
                <Text type="secondary">
                  还没有添加任何商品，去看看有什么好东西吧！
                </Text>
              </div>
            }
          >
            <Link href="/products">
              <Button type="primary" icon={<ShoppingOutlined />} size="large">
                开始购物
              </Button>
            </Link>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 面包屑导航 */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <Link href="/">
            <HomeOutlined /> 首页
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>购物车</Breadcrumb.Item>
      </Breadcrumb>

      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>购物车 ({cart.summary.totalItems} 件商品)</Title>
        <Popconfirm
          title="确定要清空购物车吗？"
          description="此操作无法恢复"
          onConfirm={handleClearCart}
          okText="确定"
          cancelText="取消"
        >
          <Button danger>清空购物车</Button>
        </Popconfirm>
      </div>

      <Row gutter={24}>
        {/* 购物车商品列表 */}
        <Col xs={24} lg={16}>
          <Card>
            <div className="space-y-4">
              {cart.items.map((item, index) => (
                <div key={item.id}>
                  <Row gutter={16} align="middle">
                    {/* 商品图片 */}
                    <Col xs={6} sm={4}>
                      <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                        <Link href={`/products/${item.product.slug}`}>
                          <Image
                            src={item.product.image || '/placeholder-product.jpg'}
                            alt={item.product.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform"
                          />
                        </Link>
                      </div>
                    </Col>

                    {/* 商品信息 */}
                    <Col xs={18} sm={20}>
                      <Row gutter={16} align="middle">
                        <Col xs={24} sm={12} md={10}>
                          <div className="space-y-1">
                            <Link href={`/products/${item.product.slug}`}>
                              <Title level={5} className="!mb-0 hover:text-blue-600 transition-colors">
                                {item.product.name}
                              </Title>
                            </Link>
                            
                            {/* 变体信息 */}
                            {item.variant && (
                              <div className="space-x-1">
                                {item.variant.attributes.map((attr, idx) => (
                                  <Tag key={idx} size="small">
                                    {attr.name}: {attr.value}
                                  </Tag>
                                ))}
                              </div>
                            )}

                            {/* 库存状态 */}
                            <div>
                              {item.inStock ? (
                                <Tag color="green" size="small">
                                  有货 ({item.availableQuantity} 件可用)
                                </Tag>
                              ) : (
                                <Tag color="red" size="small">缺货</Tag>
                              )}
                            </div>
                          </div>
                        </Col>

                        {/* 单价 */}
                        <Col xs={8} sm={4}>
                          <Text className="font-semibold">
                            {formatPrice(item.price)}
                          </Text>
                        </Col>

                        {/* 数量控制 */}
                        <Col xs={8} sm={4}>
                          <div className="flex items-center">
                            <Button
                              size="small"
                              icon={<MinusOutlined />}
                              disabled={
                                item.quantity <= 1 || 
                                updatingItems.has(item.id) ||
                                !item.inStock
                              }
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            />
                            <InputNumber
                              size="small"
                              min={1}
                              max={item.availableQuantity}
                              value={item.quantity}
                              onChange={(value) => handleQuantityChange(item.id, value || 1)}
                              disabled={updatingItems.has(item.id) || !item.inStock}
                              className="mx-1 w-16 text-center"
                              controls={false}
                            />
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              disabled={
                                item.quantity >= item.availableQuantity || 
                                updatingItems.has(item.id) ||
                                !item.inStock
                              }
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            />
                          </div>
                        </Col>

                        {/* 小计 */}
                        <Col xs={6} sm={3}>
                          <Text className="font-bold text-red-500">
                            {formatPrice(item.lineTotal)}
                          </Text>
                        </Col>

                        {/* 删除按钮 */}
                        <Col xs={2} sm={1}>
                          <Popconfirm
                            title="确定要删除这件商品吗？"
                            onConfirm={() => handleRemoveItem(item.id)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              danger
                              disabled={updatingItems.has(item.id)}
                              className="hover:bg-red-50"
                            />
                          </Popconfirm>
                        </Col>
                      </Row>
                    </Col>
                  </Row>

                  {/* 分隔线 */}
                  {index < cart.items.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 订单摘要 */}
        <Col xs={24} lg={8}>
          <Card title="订单摘要" className="sticky top-4">
            <div className="space-y-4">
              {/* 商品统计 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Text>商品数量:</Text>
                  <Text>{cart.summary.totalItems} 件</Text>
                </div>
                <div className="flex justify-between">
                  <Text>商品小计:</Text>
                  <Text>{formatPrice(cart.summary.subtotal)}</Text>
                </div>
              </div>

              <Divider />

              {/* 运费计算 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Text>运费:</Text>
                  <Text>
                    {cart.summary.subtotal >= 99 ? (
                      <span className="text-green-500">免费</span>
                    ) : (
                      formatPrice(9.99)
                    )}
                  </Text>
                </div>
                {cart.summary.subtotal < 99 && (
                  <Text type="secondary" className="text-sm">
                    满$99免运费，还差 {formatPrice(99 - cart.summary.subtotal)}
                  </Text>
                )}
              </div>

              <Divider />

              {/* 总计 */}
              <div className="flex justify-between text-lg font-bold">
                <Text strong>总计:</Text>
                <Text strong className="text-red-500">
                  {formatPrice(
                    cart.summary.subtotal + (cart.summary.subtotal >= 99 ? 0 : 9.99)
                  )}
                </Text>
              </div>

              {/* 优惠券 */}
              <div className="bg-gray-50 p-3 rounded">
                <Text type="secondary" className="text-sm">
                  🎉 新用户首单立减$10，使用优惠码: WELCOME10
                </Text>
              </div>

              {/* 结算按钮 */}
              <div className="space-y-2">
                <Button
                  type="primary"
                  size="large"
                  icon={<CreditCardOutlined />}
                  onClick={() => router.push('/checkout')}
                  className="w-full"
                  disabled={!cart.items.every(item => item.inStock)}
                >
                  立即结算
                </Button>
                
                <Link href="/products">
                  <Button size="large" className="w-full">
                    继续购物
                  </Button>
                </Link>
              </div>

              {/* 安全提示 */}
              <div className="text-center">
                <Text type="secondary" className="text-xs">
                  🔒 您的支付信息受到SSL加密保护
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
