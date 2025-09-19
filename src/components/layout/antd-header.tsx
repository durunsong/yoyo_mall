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
  Typography
} from 'antd';
import {
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  MenuOutlined,
  GlobalOutlined,
  BellOutlined,
  HeartOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useLocaleStorage } from '@/hooks/use-locale-storage';
import { useRouter } from 'next/navigation';

const { Header } = Layout;
const { Search } = Input;
const { Text } = Typography;

// 导航菜单配置
const navItems = [
  { key: '/', label: '首页', href: '/' },
  { key: '/products', label: '商品', href: '/products' },
  { key: '/categories', label: '分类', href: '/categories' },
  { key: '/brands', label: '品牌', href: '/brands' },
  { key: '/deals', label: '优惠', href: '/deals' },
];

// 语言选项
const languageItems: MenuProps['items'] = [
  { key: 'zh-CN', label: '🇨🇳 中文' },
  { key: 'en-US', label: '🇺🇸 English' },
  { key: 'ja-JP', label: '🇯🇵 日本語' },
  { key: 'ko-KR', label: '🇰🇷 한국어' },
];

// 用户菜单
const userMenuItems: MenuProps['items'] = [
  { 
    key: 'profile', 
    label: '个人中心',
    icon: <UserOutlined />
  },
  { 
    key: 'orders', 
    label: '我的订单',
    icon: <ShoppingCartOutlined />
  },
  { 
    key: 'wishlist', 
    label: '我的收藏',
    icon: <HeartOutlined />
  },
  { type: 'divider' },
  { 
    key: 'logout', 
    label: '退出登录',
    icon: <LogoutOutlined />
  },
];

export function AntdHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, defaultTab, openModal, closeModal } = useAuthModal();
  const { setLocale } = useLocaleStorage();

  // 处理搜索
  const handleSearch = (value: string) => {
    console.log('搜索:', value);
    // TODO: 实现搜索逻辑
  };

  // 处理语言切换
  const handleLanguageChange: MenuProps['onClick'] = ({ key }) => {
    const newLocale = key as string;
    console.log('切换语言:', newLocale);
    
    // 使用hook保存语言偏好
    setLocale(newLocale);
    
    // 构建新的URL
    const currentPathname = pathname;
    let newPath: string;
    
    // 获取当前路径中的语言部分
    const pathSegments = currentPathname.split('/').filter(Boolean);
    const currentLocaleFromPath = pathSegments[0];
    
    // 检查第一个段是否是语言代码
    const locales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
    const isCurrentPathHasLocale = locales.includes(currentLocaleFromPath);
    
    if (newLocale === 'zh-CN') {
      // 切换到默认语言，移除语言前缀
      if (isCurrentPathHasLocale) {
        newPath = '/' + pathSegments.slice(1).join('/');
      } else {
        newPath = currentPathname;
      }
    } else {
      // 切换到非默认语言
      if (isCurrentPathHasLocale) {
        pathSegments[0] = newLocale;
        newPath = '/' + pathSegments.join('/');
      } else {
        newPath = `/${newLocale}${currentPathname === '/' ? '' : currentPathname}`;
      }
    }
    
    // 清理路径
    newPath = newPath.replace(/\/+/g, '/');
    if (newPath === '') newPath = '/';
    
    console.log(`路径切换: ${currentPathname} → ${newPath}`);
    
    // 使用window.location.href进行完整的页面重新加载
    window.location.href = newPath;
  };

  // 处理用户菜单点击
  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    console.log('用户菜单:', key);
    
    switch (key) {
      case 'profile':
        // 跳转到个人中心
        router.push('/profile');
        break;
      case 'orders':
        // 跳转到我的订单
        router.push('/profile?tab=orders');
        break;
      case 'wishlist':
        // 跳转到我的收藏
        router.push('/profile?tab=wishlist');
        break;
      case 'logout':
        // 处理登出
        handleLogout();
        break;
      default:
        break;
    }
  };

  // 处理登出
  const handleLogout = () => {
    // 清理用户状态
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-info');
    
    // 清理认证相关的cookie
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
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
      <div className="bg-blue-600 text-white text-center py-1 text-sm">
        <Space size="large">
          <Text className="text-white">免费配送满$99</Text>
          <Text className="text-white">7天无理由退货</Text>
          <Text className="text-white">24小时客服支持</Text>
        </Space>
      </div>

      {/* 主导航栏 */}
      <Header className="bg-white shadow-sm px-4 lg:px-8" style={{ height: 'auto', lineHeight: 'normal', padding: '12px 24px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xl">Y</span>
                </div>
                <span className="hidden sm:block text-xl font-bold text-gray-900">YOYO Mall</span>
              </Link>
            </div>

            {/* 桌面端导航菜单 */}
            <div className="hidden lg:flex flex-1 justify-center">
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
            <div className="hidden lg:block mx-8 flex-1 max-w-md">
              <Search
                placeholder="搜索商品..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
              />
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
              <Dropdown
                menu={{ items: languageItems, onClick: handleLanguageChange }}
                placement="bottomRight"
              >
                <Button type="text" icon={<GlobalOutlined />} />
              </Dropdown>

              {/* 通知 */}
              <Badge count={3} size="small">
                <Button type="text" icon={<BellOutlined />} />
              </Badge>

              {/* 购物车 */}
              <Badge count={0} showZero={false}>
                <Button 
                  type="text" 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => {
                    // TODO: 打开购物车
                  }}
                />
              </Badge>

              {/* 用户菜单 */}
              <Button type="text" onClick={() => openModal('login')}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span className="hidden sm:inline">登录</span>
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
        title="菜单"
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={300}
      >
        <div className="space-y-4">
          {/* 搜索框 */}
          <Search
            placeholder="搜索商品..."
            allowClear
            enterButton
            onSearch={handleSearch}
          />

          {/* 导航菜单 */}
          <Menu
            mode="vertical"
            selectedKeys={[pathname]}
            className="border-none"
            items={navItems.map(item => ({
              key: item.key,
              label: (
                <Link 
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            }))}
          />

          {/* 其他操作 */}
          <div className="space-y-2 pt-4 border-t">
            <Button 
              block
              onClick={() => {
                setMobileMenuOpen(false);
                openModal('login');
              }}
            >
              <UserOutlined /> 登录/注册
            </Button>
            <Button block type="primary">
              <ShoppingCartOutlined /> 购物车
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 认证弹窗 */}
      <AuthModal 
        open={isOpen}
        onClose={closeModal}
        defaultTab={defaultTab}
      />
    </>
  );
}
