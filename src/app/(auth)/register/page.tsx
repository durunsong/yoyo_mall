'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { GoogleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Button, Input, Form, message, Divider, Checkbox } from 'antd';
import { motion } from 'framer-motion';

// 表单验证 schema
const registerSchema = z.object({
  name: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符')
    .regex(/^[a-zA-Z\u4e00-\u9fa5\s]+$/, '姓名只能包含中文、英文和空格'),
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(8, '密码至少需要8个字符')
    .max(50, '密码不能超过50个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '密码必须包含至少一个大写字母、一个小写字母和一个数字'
    ),
  confirmPassword: z.string().min(1, '请确认密码'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: '请同意服务条款和隐私政策',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  // 邮箱注册
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'EMAIL_EXISTS') {
          setError('email', { message: '该邮箱已被注册' });
        } else {
          setError('root', { message: result.error || '注册失败，请稍后重试' });
        }
        return;
      }

      message.success('注册成功！正在自动登录...');

      // 自动登录
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('注册错误:', error);
      setError('root', { message: '网络错误，请稍后重试' });
    } finally {
      setIsLoading(false);
    }
  };

  // Google 注册
  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      });

      if (result?.error) {
        message.error('Google 注册失败，请稍后重试');
      }
    } catch (error) {
      console.error('Google 注册错误:', error);
      message.error('Google 注册失败，请稍后重试');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 密码强度检查
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    const strengthText = ['很弱', '弱', '一般', '强', '很强'][Math.min(strength - 1, 4)];
    const strengthColor = ['#ff4d4f', '#ff7a45', '#ffa940', '#52c41a', '#389e0d'][Math.min(strength - 1, 4)];

    return { strength, text: strengthText, color: strengthColor };
  };

  const passwordStrength = getPasswordStrength(password || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl mb-4"
          >
            <span className="text-2xl font-bold text-white">Y</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">创建账户</h1>
          <p className="text-gray-600">加入 YOYO Mall，开始您的购物之旅</p>
        </div>

        {/* 注册表单 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          {/* Google 注册按钮 */}
          <Button
            type="default"
            size="large"
            icon={<GoogleOutlined />}
            loading={googleLoading}
            onClick={handleGoogleRegister}
            className="w-full mb-6 h-12 border-gray-300 hover:border-purple-400 hover:text-purple-600 transition-all duration-200"
          >
            使用 Google 账户注册
          </Button>

          <Divider className="my-6">
            <span className="text-gray-500 text-sm">或使用邮箱注册</span>
          </Divider>

          {/* 错误提示 */}
          {errors.root && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 姓名输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名
              </label>
              <Input
                {...register('name')}
                placeholder="请输入您的姓名"
                size="large"
                status={errors.name ? 'error' : ''}
                className="rounded-lg"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="请输入您的邮箱"
                size="large"
                status={errors.email ? 'error' : ''}
                className="rounded-lg"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <Input.Password
                {...register('password')}
                placeholder="请输入您的密码"
                size="large"
                status={errors.password ? 'error' : ''}
                className="rounded-lg"
                iconRender={(visible) =>
                  visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                }
              />
              {password && passwordStrength.strength > 0 && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1">
                      <div
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* 确认密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <Input.Password
                {...register('confirmPassword')}
                placeholder="请再次输入密码"
                size="large"
                status={errors.confirmPassword ? 'error' : ''}
                className="rounded-lg"
                iconRender={(visible) =>
                  visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                }
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* 同意条款 */}
            <div>
              <label className="flex items-start space-x-2">
                <input
                  {...register('agreeToTerms')}
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">
                  我已阅读并同意
                  <Link href="/terms" className="text-purple-600 hover:text-purple-700">
                    服务条款
                  </Link>
                  和
                  <Link href="/privacy" className="text-purple-600 hover:text-purple-700">
                    隐私政策
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
              )}
            </div>

            {/* 注册按钮 */}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-600 border-none rounded-lg font-medium hover:from-purple-600 hover:to-blue-700 transition-all duration-200"
            >
              {isLoading ? '注册中...' : '创建账户'}
            </Button>
          </form>

          {/* 登录链接 */}
          <div className="mt-8 text-center">
            <span className="text-gray-600">已有账户？</span>
            <Link
              href="/login"
              className="ml-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              立即登录
            </Link>
          </div>
        </motion.div>

        {/* 底部信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            注册即表示您同意接收我们的营销邮件，您可以随时取消订阅
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
