/**
 * Footer组件
 * 网站底部，包含链接、联系信息、社交媒体等
 */

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

// Footer链接配置
const footerLinks = {
  company: {
    title: '公司信息',
    links: [
      { name: '关于我们', href: '/about' },
      { name: '联系我们', href: '/contact' },
      { name: '招聘信息', href: '/careers' },
      { name: '新闻资讯', href: '/news' },
    ],
  },
  customer: {
    title: '客户服务',
    links: [
      { name: '帮助中心', href: '/help' },
      { name: '配送信息', href: '/shipping' },
      { name: '退货政策', href: '/returns' },
      { name: '常见问题', href: '/faq' },
    ],
  },
  account: {
    title: '我的账户',
    links: [
      { name: '我的订单', href: '/orders' },
      { name: '我的心愿单', href: '/wishlist' },
      { name: '账户设置', href: '/account' },
      { name: '地址管理', href: '/addresses' },
    ],
  },
  legal: {
    title: '法律条款',
    links: [
      { name: '使用条款', href: '/terms' },
      { name: '隐私政策', href: '/privacy' },
      { name: 'Cookie政策', href: '/cookies' },
      { name: '免责声明', href: '/disclaimer' },
    ],
  },
};

// 社交媒体链接
const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: '#', color: 'hover:text-blue-600' },
  { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
  { name: 'Instagram', icon: Instagram, href: '#', color: 'hover:text-pink-500' },
  { name: 'YouTube', icon: Youtube, href: '#', color: 'hover:text-red-600' },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="bg-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">订阅我们的新闻通讯</h3>
              <p className="text-gray-300">获取最新优惠和产品资讯</p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="输入您的邮箱地址"
                className="flex-1 md:w-80 px-4 py-2 rounded-l-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-r-md transition-colors">
                订阅
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xl">Y</span>
              </div>
              <span className="text-xl font-bold">YOYO Mall</span>
            </div>
            <p className="text-gray-300 mb-4 text-sm">
              专业的跨境电商平台，致力于为全球用户提供优质的商品和服务。
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@yoyomall.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>123 Business Street, City, State 12345</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-gray-300 mb-4 md:mb-0">
              © 2024 YOYO Mall. 保留所有权利。
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300 hidden md:inline">关注我们:</span>
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className={`text-gray-300 transition-colors ${social.color}`}
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
