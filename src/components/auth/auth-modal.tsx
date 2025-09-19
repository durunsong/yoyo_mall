/**
 * 登录注册弹窗组件
 * 支持登录、注册、密码强度校验、谷歌一键登录
 */

'use client';

import { useState, useCallback } from 'react';
import { 
  Modal, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Checkbox, 
  Space, 
  Divider, 
  Typography, 
  message,
  Progress
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GoogleOutlined
} from '@ant-design/icons';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const { Text, Link } = Typography;

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface RegisterFormValues {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

// 密码强度校验函数
const getPasswordStrength = (password: string) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  // 计算得分
  Object.values(checks).forEach(check => {
    if (check) score += 20;
  });

  let level = '弱';
  let color = '#ff4d4f';
  if (score >= 80) {
    level = '强';
    color = '#52c41a';
  } else if (score >= 60) {
    level = '中';
    color = '#faad14';
  }

  return {
    score,
    level,
    color,
    checks,
    suggestions: [
      !checks.length && '密码长度至少8位',
      !checks.lowercase && '包含小写字母',
      !checks.uppercase && '包含大写字母', 
      !checks.number && '包含数字',
      !checks.special && '包含特殊字符'
    ].filter(Boolean) as string[]
  };
};

export function AuthModal({ open, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, level: '弱', color: '#ff4d4f', suggestions: [] as string[] });

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  // 处理登录
  const handleLogin = async (values: LoginFormValues) => {
    setLoginLoading(true);
    try {
      console.log('登录信息:', values);
      // TODO: 实现登录API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('登录成功！');
      onClose();
    } catch (error) {
      message.error('登录失败，请检查邮箱和密码');
    } finally {
      setLoginLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async (values: RegisterFormValues) => {
    setRegisterLoading(true);
    try {
      console.log('注册信息:', values);
      // TODO: 实现注册API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('注册成功！请查看邮箱验证邮件');
      onClose();
    } catch (error) {
      message.error('注册失败，请稍后重试');
    } finally {
      setRegisterLoading(false);
    }
  };

  // 处理谷歌登录成功
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    try {
      console.log('谷歌登录成功:', credentialResponse);
      // TODO: 发送credentialResponse.credential到后端验证
      // const response = await fetch('/api/auth/google', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token: credentialResponse.credential })
      // });
      message.success('谷歌登录成功！');
      onClose();
    } catch (error) {
      console.error('谷歌登录失败:', error);
      message.error('谷歌登录失败');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 处理谷歌登录失败
  const handleGoogleError = () => {
    console.error('谷歌登录失败');
    message.error('谷歌登录失败，请重试');
  };

  // 密码强度实时检测
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setPasswordStrength(getPasswordStrength(password));
  }, []);

  // 演示账户信息
  const demoAccount = (
    <div className="bg-blue-50 p-3 rounded-lg mb-4">
      <div className="flex items-center mb-2">
        <Text strong className="text-blue-600">💡 演示账户</Text>
      </div>
      <Text className="text-sm text-blue-600">
        邮箱: demo@example.com, 密码: Demo123!
      </Text>
    </div>
  );

  const loginTab = (
    <div className="px-2">
      {demoAccount}
      
      <Form
        form={loginForm}
        layout="vertical"
        onFinish={handleLogin}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          label="用户名/邮箱/手机号"
          name="email"
          rules={[
            { required: true, message: '请输入用户名、邮箱或手机号' }
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="用户名/邮箱/手机号"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: '请输入密码' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="密码"
            autoComplete="current-password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item>
          <div className="flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Link className="text-blue-600">忘记密码？</Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loginLoading}
            className="w-full h-10"
            size="large"
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  const registerTab = (
    <div className="px-2">
      <Form
        form={registerForm}
        layout="vertical"
        onFinish={handleRegister}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' },
            { max: 20, message: '用户名最多20个字符' }
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="admin"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="jack@163.com"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label="手机号"
          name="phone"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
          ]}
        >
          <Input
            prefix={<PhoneOutlined className="text-gray-400" />}
            placeholder="19985562575"
            autoComplete="tel"
          />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码至少8个字符' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const strength = getPasswordStrength(value);
                if (strength.score < 60) {
                  return Promise.reject(new Error('密码强度不够，请参考建议'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="yyy111."
            autoComplete="new-password"
            onChange={handlePasswordChange}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        {/* 密码强度指示器 */}
        <Form.Item>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Text className="text-sm">密码强度:</Text>
              <Text className="text-sm" style={{ color: passwordStrength.color }}>
                {passwordStrength.level}
              </Text>
            </div>
            <Progress 
              percent={passwordStrength.score} 
              strokeColor={passwordStrength.color}
              showInfo={false}
              size="small"
            />
            {passwordStrength.suggestions.length > 0 && (
              <div className="text-xs text-gray-500">
                <div>建议:</div>
                <ul className="list-disc list-inside space-y-1">
                  {passwordStrength.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="••••••••"
            autoComplete="new-password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="agree"
          valuePropName="checked"
          rules={[
            { 
              validator: (_, value) => 
                value ? Promise.resolve() : Promise.reject(new Error('请同意用户协议'))
            }
          ]}
        >
          <Checkbox>
            我已阅读并同意 <Link className="text-blue-600">用户协议</Link> 和 <Link className="text-blue-600">隐私政策</Link>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={registerLoading}
            className="w-full h-10"
            size="large"
          >
            注册
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  return (
    <Modal
      title="登录"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      maskClosable={false}
    >
      <div className="py-4">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'login' | 'register')}
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: loginTab
            },
            {
              key: 'register', 
              label: '注册',
              children: registerTab
            }
          ]}
        />

        <Divider>或者</Divider>

        {/* 谷歌登录按钮 */}
        <div className="px-2">
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "demo"}>
            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text={activeTab === 'login' ? 'signin_with' : 'signup_with'}
                theme="outline"
                size="large"
                width={400}
                context={activeTab === 'login' ? 'signin' : 'signup'}
              />
            </div>
          </GoogleOAuthProvider>
        </div>

        {/* 演示账户 - 底部说明 */}
        <div className="px-2 mt-4">
          {demoAccount}
        </div>
      </div>
    </Modal>
  );
}
