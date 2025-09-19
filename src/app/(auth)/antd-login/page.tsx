/**
 * 使用Ant Design的登录页面
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Row,
  Col,
  Divider,
  Space,
  message
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GoogleOutlined,
  WechatOutlined,
  AppleOutlined
} from '@ant-design/icons';

const { Title, Text, Link: AntLink } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export default function AntdLoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 处理登录
  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      console.log('登录信息:', values);
      // TODO: 实现登录逻辑
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      message.success('登录成功！');
    } catch (error) {
      message.error('登录失败，请检查您的邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  // 处理第三方登录
  const handleThirdPartyLogin = (provider: string) => {
    console.log(`使用 ${provider} 登录`);
    message.info(`${provider} 登录功能开发中...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* 头部 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">Y</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">YOYO Mall</span>
          </Link>
          <Title level={2} className="mt-6 text-gray-900">
            欢迎回来
          </Title>
          <Text type="secondary" className="text-base">
            登录您的账户以继续购物
          </Text>
        </div>

        {/* 登录表单卡片 */}
        <Card className="shadow-lg border-0">
          <Form
            form={form}
            name="login"
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              label="邮箱地址"
              name="email"
              rules={[
                { required: true, message: '请输入您的邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入邮箱地址"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入您的密码' },
                { min: 6, message: '密码至少需要6个字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请输入密码"
                autoComplete="current-password"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item>
              <Row justify="space-between" align="middle">
                <Col>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>记住我</Checkbox>
                  </Form.Item>
                </Col>
                <Col>
                  <AntLink href="/forgot-password" className="text-blue-600 hover:text-blue-800">
                    忘记密码？
                  </AntLink>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="h-12 font-medium"
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          {/* 分割线 */}
          <Divider>
            <Text type="secondary">或者使用以下方式登录</Text>
          </Divider>

          {/* 第三方登录 */}
          <Space direction="vertical" size="middle" className="w-full">
            <Button
              icon={<GoogleOutlined />}
              block
              size="large"
              onClick={() => handleThirdPartyLogin('Google')}
              className="h-12 border-gray-300 hover:border-red-400 hover:text-red-500"
            >
              使用 Google 登录
            </Button>
            
            <Row gutter={12}>
              <Col span={12}>
                <Button
                  icon={<WechatOutlined />}
                  block
                  size="large"
                  onClick={() => handleThirdPartyLogin('微信')}
                  className="h-12 border-gray-300 hover:border-green-400 hover:text-green-500"
                >
                  微信登录
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  icon={<AppleOutlined />}
                  block
                  size="large"
                  onClick={() => handleThirdPartyLogin('Apple')}
                  className="h-12 border-gray-300 hover:border-gray-600 hover:text-gray-700"
                >
                  Apple 登录
                </Button>
              </Col>
            </Row>
          </Space>

          {/* 注册链接 */}
          <div className="mt-8 text-center">
            <Text type="secondary">
              还没有账户？{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                立即注册
              </Link>
            </Text>
          </div>
        </Card>

        {/* 底部链接 */}
        <div className="mt-8 text-center">
          <Space split={<span className="text-gray-300">•</span>}>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-sm">
              服务条款
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
              隐私政策
            </Link>
            <Link href="/help" className="text-gray-500 hover:text-gray-700 text-sm">
              帮助中心
            </Link>
          </Space>
        </div>
      </div>
    </div>
  );
}
