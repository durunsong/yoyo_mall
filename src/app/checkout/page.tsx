/**
 * 结算页面
 * 展示订单信息并处理支付
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Steps, Row, Col, Divider, Button, message, Spin } from 'antd';
import { 
  ShoppingCartOutlined, 
  CreditCardOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import StripePayment from '@/components/checkout/stripe-payment';

const { Step } = Steps;

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [currentStep, setCurrentStep] = useState(1);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 获取订单信息
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        message.error('缺少订单ID');
        router.push('/cart');
        return;
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const result = await response.json();

        if (result.success) {
          setOrder(result.data);
        } else {
          message.error(result.message || '获取订单信息失败');
          router.push('/cart');
        }
      } catch (error) {
        message.error('网络错误，请重试');
        router.push('/cart');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  // 处理支付成功
  const handlePaymentSuccess = (result: any) => {
    setPaymentSuccess(true);
    setCurrentStep(2);
    
    // 3秒后跳转到订单详情页
    setTimeout(() => {
      router.push(`/orders/${orderId}`);
    }, 3000);
  };

  // 处理支付错误
  const handlePaymentError = (error: string) => {
    message.error(error);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Spin size="large" tip="加载订单信息..." />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">订单不存在</h1>
          <Button type="primary" onClick={() => router.push('/cart')}>
            返回购物车
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">结算</h1>
          <p className="text-gray-600">订单号: {order.orderNumber}</p>
        </div>

        {/* 进度条 */}
        <Card className="mb-8">
          <Steps current={currentStep} className="mb-0">
            <Step 
              title="确认订单" 
              icon={<ShoppingCartOutlined />}
              description="检查商品和金额"
            />
            <Step 
              title="支付" 
              icon={<CreditCardOutlined />}
              description="安全支付处理"
            />
            <Step 
              title="完成" 
              icon={<CheckCircleOutlined />}
              description="支付成功"
            />
          </Steps>
        </Card>

        <Row gutter={24}>
          {/* 订单信息 */}
          <Col xs={24} lg={14}>
            <Card title="订单信息" className="mb-6">
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        单价: {order.currency} {item.unitPrice.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">
                        {order.currency} {item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                <Divider />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>总计:</span>
                  <span className="text-blue-600">
                    {order.currency} {order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          </Col>

          {/* 支付区域 */}
          <Col xs={24} lg={10}>
            {!paymentSuccess ? (
              <StripePayment
                orderId={order.id}
                amount={order.totalAmount}
                currency={order.currency}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                disabled={currentStep !== 1}
              />
            ) : (
              <Card className="text-center">
                <div className="py-8">
                  <CheckCircleOutlined 
                    style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} 
                  />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">支付成功!</h3>
                  <p className="text-gray-600 mb-4">
                    您的订单 {order.orderNumber} 已成功支付
                  </p>
                  <p className="text-sm text-gray-500">
                    正在跳转到订单详情页...
                  </p>
                </div>
              </Card>
            )}
          </Col>
        </Row>

        {/* 安全提示 */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <div className="text-center">
            <h4 className="font-semibold text-blue-900 mb-2">安全支付保障</h4>
            <p className="text-sm text-blue-700">
              您的支付信息受到Stripe的银行级安全保护，支持256位SSL加密和3D Secure验证
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
