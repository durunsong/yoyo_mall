'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn, getSession } from 'next-auth/react';
import { GoogleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Button, Input, Form, message, Divider } from 'antd';
import { motion } from 'framer-motion';

// 表单验证 schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少需要6个字符')
    .max(50, '密码不能超过50个字符'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 邮箱密码登录
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('root', { message: '邮箱或密码错误' });
        } else {
          setError('root', { message: '登录失败，请稍后重试' });
        }
        return;
      }

      if (result?.ok) {
        message.success('登录成功！');
        
        // 获取用户信息并重定向
        const session = await getSession();
        if (session?.user) {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('登录错误:', error);
      setError('root', { message: '网络错误，请稍后重试' });
    } finally {
      setIsLoading(false);
    }
  };

  // Google 登录
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      });

      if (result?.error) {
        message.error('Google 登录失败，请稍后重试');
      }
    } catch (error) {
      console.error('Google 登录错误:', error);
      message.error('Google 登录失败，请稍后重试');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
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
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4"
          >
            <span className="text-2xl font-bold text-white">Y</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来</h1>
          <p className="text-gray-600">登录您的 YOYO Mall 账户</p>
        </div>

        {/* 登录表单 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          {/* Google 登录按钮 */}
          <Button
            type="default"
            size="large"
            icon={<GoogleOutlined />}
            loading={googleLoading}
            onClick={handleGoogleLogin}
            className="w-full mb-6 h-12 border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
          >
            使用 Google 账户登录
          </Button>

          <Divider className="my-6">
            <span className="text-gray-500 text-sm">或使用邮箱登录</span>
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* 忘记密码链接 */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                忘记密码？
              </Link>
            </div>

            {/* 登录按钮 */}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 border-none rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>

          {/* 注册链接 */}
          <div className="mt-8 text-center">
            <span className="text-gray-600">还没有账户？</span>
            <Link
              href="/register"
              className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              立即注册
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
            登录即表示您同意我们的
            <Link href="/terms" className="text-blue-600 hover:text-blue-700">
              服务条款
            </Link>
            和
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
              隐私政策
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}