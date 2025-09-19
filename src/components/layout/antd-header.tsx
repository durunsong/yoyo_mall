/**
 * Ant Design Header组件
 * 网站顶部导航栏，使用Ant Design组件
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layout,
  Menu,
  Input,
  Button,
  Badge,
  Dropdown,
  Space,
  Drawer,
  Avatar,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  MenuOutlined,
  GlobalOutlined,
  BellOutlined,
  HeartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useRouter } from 'next/navigation';
import { useStaticTranslations } from '@/hooks/use-translations';
import ShoppingCartBadge from './shopping-cart-badge';
import ProductSearch from '@/components/products/product-search';
import LanguageSwitcher from '@/components/ui/language-switcher';

const { Header } = Layout;
// const { Search } = Input; // 不再需要，使用自定义搜索组件
const { Text } = Typography;

// 导航菜单配置 - 现在使用翻译
const getNavItems = (t: (key: string) => string) => [
  { key: '/', label: t('home'), href: '/' },
  { key: '/products', label: t('products'), href: '/products' },
  { key: '/categories', label: t('categories'), href: '/categories' },
  { key: '/brands', label: t('brands'), href: '/brands' },
  { key: '/deals', label: t('deals'), href: '/deals' },
];

// 用户菜单 (暂时未使用，保留供后续开发)
// const userMenuItems: MenuProps['items'] = [
//   {
//     key: 'profile',
//     label: '个人中心',
//     icon: <UserOutlined />,
//   },
//   {
//     key: 'orders',
//     label: '我的订单',
//     icon: <ShoppingCartOutlined />,
//   },
//   {
//     key: 'wishlist',
//     label: '我的收藏',
//     icon: <HeartOutlined />,
//   },
//   { type: 'divider' },
//   {
//     key: 'logout',
//     label: '退出登录',
//     icon: <LogoutOutlined />,
//   },
// ];

export function AntdHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, defaultTab, openModal, closeModal } = useAuthModal();
  const { t, locale } = useStaticTranslations('common');

  // 移除handleSearch，现在使用ProductSearch组件
  
  // 获取翻译后的导航项
  const navItems = getNavItems(t);

  // 处理用户菜单点击 (暂时未使用)
  // const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
  //   console.log('用户菜单:', key);
  //
  //   switch (key) {
  //     case 'profile':
  //       // 跳转到个人中心
  //       router.push('/profile');
  //       break;
  //     case 'orders':
  //       // 跳转到我的订单
  //       router.push('/profile?tab=orders');
  //       break;
  //     case 'wishlist':
  //       // 跳转到我的收藏
  //       router.push('/profile?tab=wishlist');
  //       break;
  //     case 'logout':
  //       // 处理登出
  //       handleLogout();
  //       break;
  //     default:
  //       break;
  //   }
  // };

  // 处理登出
  const handleLogout = () => {
    // 清理用户状态
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-info');

    // 清理认证相关的cookie
    document.cookie =
      'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie =
      'refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    // 显示登出成功消息
    console.log('用户已登出');

    // 刷新页面或跳转到首页
    router.push('/');

    // 可选：显示登出成功提示
    // message.success('已成功登出');
  };

  return (
    <>
      {/* 顶部通知栏 */}
      <div className="bg-blue-600 py-1 text-center text-sm text-white">
        <Space size="large">
          <Text className="text-white">{locale === 'zh-CN' ? '免费配送满$99' : 'Free shipping over $99'}</Text>
          <Text className="text-white">{locale === 'zh-CN' ? '7天无理由退货' : '7-day returns'}</Text>
          <Text className="text-white">{locale === 'zh-CN' ? '24小时客服支持' : '24/7 support'}</Text>
        </Space>
      </div>

      {/* 主导航栏 */}
      <Header
        className="bg-white px-4 shadow-sm lg:px-8"
        style={{ height: 'auto', lineHeight: 'normal', padding: '12px 24px' }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
                  <span className="text-xl font-bold text-white">Y</span>
                </div>
                <span className="hidden text-xl font-bold text-gray-900 sm:block">
                  YOYO Mall
                </span>
              </Link>
            </div>

            {/* 桌面端导航菜单 */}
            <div className="hidden flex-1 justify-center lg:flex">
              <Menu
                mode="horizontal"
                selectedKeys={[pathname]}
                className="border-none bg-transparent"
                items={navItems.map(item => ({
                  key: item.key,
                  label: <Link href={item.href}>{item.label}</Link>,
                }))}
              />
            </div>

            {/* 搜索框 - 桌面端 */}
            <div className="mx-8 hidden max-w-md flex-1 lg:block">
              <ProductSearch placeholder={t('searchPlaceholder')} />
            </div>

            {/* 右侧操作按钮 */}
            <div className="flex items-center space-x-4">
              {/* 搜索按钮 - 移动端 */}
              <Button
                type="text"
                icon={<SearchOutlined />}
                className="lg:hidden"
                onClick={() => {
                  // TODO: 显示移动端搜索框
                }}
              />

              {/* 语言切换 */}
              <LanguageSwitcher mode="button" />

              {/* 通知 */}
              <Badge count={3} size="small">
                <Button type="text" icon={<BellOutlined />} />
              </Badge>

              {/* 购物车 */}
              <ShoppingCartBadge />

              {/* 用户菜单 */}
              <Button type="text" onClick={() => openModal('login')}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span className="hidden sm:inline">{t('login')}</span>
                </Space>
              </Button>

              {/* 移动端菜单按钮 */}
              <Button
                type="text"
                icon={<MenuOutlined />}
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              />
            </div>
          </div>
        </div>
      </Header>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title={t('menu')}
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={300}
      >
        <div className="space-y-4">
          {/* 搜索框 */}
          <ProductSearch placeholder={t('searchPlaceholder')} />

          {/* 导航菜单 */}
          <Menu
            mode="vertical"
            selectedKeys={[pathname]}
            className="border-none"
            items={navItems.map(item => ({
              key: item.key,
              label: (
                <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ),
            }))}
          />

          {/* 其他操作 */}
          <div className="space-y-2 border-t pt-4">
            <Button
              block
              onClick={() => {
                setMobileMenuOpen(false);
                openModal('login');
              }}
            >
              <UserOutlined /> {t('login')}/{t('register')}
            </Button>
            <Button block type="primary">
              <ShoppingCartOutlined /> {t('cart')}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 认证弹窗 */}
      <AuthModal open={isOpen} onClose={closeModal} defaultTab={defaultTab} />
    </>
  );
}
