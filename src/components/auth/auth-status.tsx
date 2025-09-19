'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Dropdown, Avatar, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Text } = Typography;

export function AuthStatus() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
      onClick: () => router.push('/profile'),
    },
    {
      key: 'orders',
      label: '我的订单',
      icon: <ShoppingCartOutlined />,
      onClick: () => router.push('/orders'),
    },
    {
      key: 'settings',
      label: '账户设置',
      icon: <SettingOutlined />,
      onClick: () => router.push('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleSignOut,
    },
  ];

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <Space>
        <Button
          type="text"
          onClick={() => router.push('/login')}
          className="text-gray-600 hover:text-blue-600"
        >
          登录
        </Button>
        <Button
          type="primary"
          onClick={() => router.push('/register')}
          className="bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
        >
          注册
        </Button>
      </Space>
    );
  }

  return (
    <Dropdown
      menu={{ items: userMenuItems }}
      placement="bottomRight"
      trigger={['click']}
    >
      <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
        <Avatar
          size="small"
          src={session.user?.image || session.user?.avatar}
          icon={<UserOutlined />}
          className="border border-gray-200"
        />
        <div className="hidden md:block">
          <Text className="text-gray-700 text-sm font-medium">
            {session.user?.name || '用户'}
          </Text>
        </div>
      </div>
    </Dropdown>
  );
}
