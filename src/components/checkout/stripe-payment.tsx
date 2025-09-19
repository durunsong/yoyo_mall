'use client';

/**
 * Stripe支付组件
 * 处理信用卡支付流程
 */

import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button, Card, Alert, Spin, message } from 'antd';
import { CreditCardOutlined, LoadingOutlined } from '@ant-design/icons';

// 初始化Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// 信用卡样式配置
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

interface StripePaymentProps {
  orderId: string;
  amount: number;
  currency: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

// 支付表单组件
function StripePaymentForm({
  orderId,
  amount,
  currency,
  onSuccess,
  onError,
  disabled = false,
}: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 创建支付意图
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/stripe/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            returnUrl: window.location.origin + '/checkout/success',
          }),
        });

        const result = await response.json();

        if (result.success) {
          setClientSecret(result.data.clientSecret);
          setPaymentId(result.data.paymentId);
        } else {
          setError(result.message || '创建支付失败');
          onError(result.message || '创建支付失败');
        }
      } catch (error) {
        const errorMessage = '网络错误，请重试';
        setError(errorMessage);
        onError(errorMessage);
      }
    };

    if (orderId) {
      createPaymentIntent();
    }
  }, [orderId, onError]);

  // 处理支付提交
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret || processing || disabled) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('支付表单未加载');
      setProcessing(false);
      return;
    }

    try {
      // 确认支付
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // 可以添加账单信息
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || '支付失败');
        onError(stripeError.message || '支付失败');
      } else if (paymentIntent) {
        // 通知后端确认支付
        if (paymentId) {
          const confirmResponse = await fetch('/api/payments/stripe/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              paymentId,
            }),
          });

          const confirmResult = await confirmResponse.json();

          if (confirmResult.success) {
            message.success('支付成功！');
            onSuccess({
              paymentIntent,
              order: confirmResult.data.order,
              nextSteps: confirmResult.data.nextSteps,
            });
          } else {
            setError(confirmResult.message || '支付确认失败');
            onError(confirmResult.message || '支付确认失败');
          }
        } else {
          onSuccess({ paymentIntent });
        }
      }
    } catch (error) {
      const errorMessage = '支付处理失败，请重试';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <Card className="text-center">
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
          tip="正在初始化支付..."
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <CreditCardOutlined />
          <span>信用卡支付</span>
        </div>
      }
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert
            message="支付错误"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            卡片信息
          </label>
          <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <CardElement options={cardElementOptions} />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            支持Visa、Mastercard、American Express等主流信用卡
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">支付金额:</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency.toUpperCase(),
              }).format(amount)}
            </span>
          </div>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={processing}
          disabled={!stripe || !elements || processing || disabled}
          className="w-full h-12 text-base"
          size="large"
        >
          {processing ? '处理中...' : `支付 ${currency.toUpperCase()} ${amount.toFixed(2)}`}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>您的支付信息受到Stripe的安全保护</p>
          <p>支持3D Secure验证，确保交易安全</p>
        </div>
      </form>
    </Card>
  );
}

// 主支付组件（包装Elements Provider）
export default function StripePayment(props: StripePaymentProps) {
  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#1890ff',
        colorBackground: '#ffffff',
        colorText: '#424770',
        colorDanger: '#df1b41',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
    locale: 'zh',
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}
