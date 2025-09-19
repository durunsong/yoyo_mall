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
  Divider,
  Typography,
  message,
  Progress,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useStaticTranslations } from '@/hooks/use-translations';

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
const getPasswordStrength = (password: string, t: (key: string) => string) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // 计算得分
  Object.values(checks).forEach(check => {
    if (check) score += 20;
  });

  let level = t('passwordWeak');
  let color = '#ff4d4f';
  if (score >= 80) {
    level = t('passwordStrong');
    color = '#52c41a';
  } else if (score >= 60) {
    level = t('passwordMedium');
    color = '#faad14';
  }

  return {
    score,
    level,
    color,
    checks,
    suggestions: [
      !checks.length && t('passwordMinLength'),
      !checks.lowercase && t('passwordNeedLowercase'),
      !checks.uppercase && t('passwordNeedUppercase'),
      !checks.number && t('passwordNeedNumber'),
      !checks.special && t('passwordNeedSpecial'),
    ].filter(Boolean) as string[],
  };
};

export function AuthModal({
  open,
  onClose,
  defaultTab = 'login',
}: AuthModalProps) {
  const { t } = useStaticTranslations('auth');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    level: t('passwordWeak'),
    color: '#ff4d4f',
    suggestions: [] as string[],
  });

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  // 处理登录
  const handleLogin = async (values: LoginFormValues) => {
    setLoginLoading(true);
    try {
      console.log('登录信息:', values);
      // TODO: 实现登录API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success(t('loginSuccess'));
      onClose();
    } catch {
      message.error(t('loginFailed'));
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
      message.success(t('registerSuccess'));
      onClose();
    } catch {
      message.error(t('registerFailed'));
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
      message.success(t('loginSuccess'));
      onClose();
    } catch (err: any) {
      console.error('谷歌登录失败:', err);
      message.error(t('loginFailed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  // 处理谷歌登录失败
  const handleGoogleError = () => {
    console.error('谷歌登录失败');
    message.error(t('loginFailed'));
  };

  // 密码强度实时检测
  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const password = e.target.value;
      setPasswordStrength(getPasswordStrength(password, t));
    },
    [t],
  );

  // 演示账户信息
  const demoAccount = (
    <div className="mb-4 rounded-lg bg-blue-50 p-3">
      <div className="mb-2 flex items-center">
        <Text strong className="text-blue-600">
          💡 {t('demoAccount')}
        </Text>
      </div>
      <Text className="text-sm text-blue-600">
        {t('demoAccountInfo')}
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
          label={t('usernameEmailPhone')}
          name="email"
          rules={[{ required: true, message: t('enterUsernameEmailPhone') }]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder={t('usernameEmailPhone')}
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          label={t('password')}
          name="password"
          rules={[{ required: true, message: t('passwordRequired') }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder={t('password')}
            autoComplete="current-password"
            iconRender={visible =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item>
          <div className="flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>{t('rememberMe')}</Checkbox>
            </Form.Item>
            <Link className="text-blue-600">{t('forgotPassword')}</Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loginLoading}
            className="h-10 w-full"
            size="large"
          >
            {t('login')}
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
          label={t('username')}
          name="username"
          rules={[
            { required: true, message: t('nameRequired') },
            { min: 3, message: t('usernameMinLength') },
            { max: 20, message: t('usernameMaxLength') },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="admin"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          label={t('email')}
          name="email"
          rules={[
            { required: true, message: t('emailRequired') },
            { type: 'email', message: t('emailInvalid') },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="jack@163.com"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label={t('phone')}
          name="phone"
          rules={[
            { required: true, message: t('phoneRequired') },
            { pattern: /^1[3-9]\d{9}$/, message: t('phoneInvalid') },
          ]}
        >
          <Input
            prefix={<PhoneOutlined className="text-gray-400" />}
            placeholder="19985562575"
            autoComplete="tel"
          />
        </Form.Item>

        <Form.Item
          label={t('password')}
          name="password"
          rules={[
            { required: true, message: t('passwordRequired') },
            { min: 8, message: t('passwordTooShort') },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const strength = getPasswordStrength(value, t);
                if (strength.score < 60) {
                  return Promise.reject(new Error(t('passwordTooWeak')));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="yyy111."
            autoComplete="new-password"
            onChange={handlePasswordChange}
            iconRender={visible =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        {/* 密码强度指示器 */}
        <Form.Item>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Text className="text-sm">{t('passwordStrength')}:</Text>
              <Text
                className="text-sm"
                style={{ color: passwordStrength.color }}
              >
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
                <div>{t('suggestions')}:</div>
                <ul className="list-inside list-disc space-y-1">
                  {passwordStrength.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Form.Item>

        <Form.Item
          label={t('confirmPassword')}
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: t('confirmPasswordRequired') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="••••••••"
            autoComplete="new-password"
            iconRender={visible =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          name="agree"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('agreeTermsRequired'))),
            },
          ]}
        >
          <Checkbox>
            {t('agreeTerms')} <Link className="text-blue-600">{t('userAgreement')}</Link> {t('and')}{' '}
            <Link className="text-blue-600">{t('privacyPolicy')}</Link>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={registerLoading}
            className="h-10 w-full"
            size="large"
          >
            {t('register')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  return (
    <Modal
      title={activeTab === 'login' ? t('login') : t('register')}
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
          onChange={key => setActiveTab(key as 'login' | 'register')}
          centered
          items={[
            {
              key: 'login',
              label: t('login'),
              children: loginTab,
            },
            {
              key: 'register',
              label: t('register'),
              children: registerTab,
            },
          ]}
        />

        <Divider>{t('or')}</Divider>

        {/* 谷歌登录按钮 */}
        <div className="px-2">
          <GoogleOAuthProvider
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'demo'}
          >
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
        <div className="mt-4 px-2">{demoAccount}</div>
      </div>
    </Modal>
  );
}
