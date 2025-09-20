/**
 * Footer组件
 * 网站底部，包含链接、联系信息、社交媒体等
 */

'use client';

import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from 'lucide-react';
import { useStaticTranslations } from '@/hooks/use-i18n';

// Footer链接配置函数 - 现在使用翻译
const getFooterLinks = (t: (key: string) => string) => ({
  company: {
    title: t('companyInfo'),
    links: [
      { name: t('aboutUs'), href: '/about' },
      { name: t('contactUs'), href: '/contact' },
      { name: t('careers'), href: '/careers' },
      { name: t('news'), href: '/news' },
    ],
  },
  customer: {
    title: t('customerService'),
    links: [
      { name: t('helpCenter'), href: '/help' },
      { name: t('shippingInfo'), href: '/shipping' },
      { name: t('returnPolicy'), href: '/returns' },
      { name: t('faq'), href: '/faq' },
    ],
  },
  account: {
    title: t('myAccount'),
    links: [
      { name: t('myOrders'), href: '/orders' },
      { name: t('myWishlist'), href: '/wishlist' },
      { name: t('accountSettings'), href: '/account' },
      { name: t('addressManagement'), href: '/addresses' },
    ],
  },
  legal: {
    title: t('legalTerms'),
    links: [
      { name: t('termsOfService'), href: '/terms' },
      { name: t('privacyPolicy'), href: '/privacy' },
      { name: t('cookiePolicy'), href: '/cookies' },
      { name: t('disclaimer'), href: '/disclaimer' },
    ],
  },
});

// 社交媒体链接
const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: '#', color: 'hover:text-blue-600' },
  { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
  {
    name: 'Instagram',
    icon: Instagram,
    href: '#',
    color: 'hover:text-pink-500',
  },
  { name: 'YouTube', icon: Youtube, href: '#', color: 'hover:text-red-600' },
];

export function Footer() {
  const { t } = useStaticTranslations('navigation');
  const footerLinks = getFooterLinks(t);

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="bg-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              <h3 className="mb-2 text-lg font-semibold">{t('subscribeNewsletter')}</h3>
              <p className="text-gray-300">{t('getLatestOffers')}</p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder={t('enterEmailAddress')}
                className="flex-1 rounded-l-md px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none md:w-80"
              />
              <button className="rounded-r-md bg-blue-600 px-6 py-2 transition-colors hover:bg-blue-700">
                {t('subscribe')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
                <span className="text-xl font-bold text-white">Y</span>
              </div>
              <span className="text-xl font-bold">YOYO Mall</span>
            </div>
            <p className="mb-4 text-sm text-gray-300">
              {t('companyDescription')}
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@yoyomall.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>123 Business Street, City, State 12345</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="mb-4 font-semibold">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-300 transition-colors hover:text-white"
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
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 text-sm text-gray-300 md:mb-0">
              © 2025 YOYO Mall. {t('allRightsReserved')}
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="hidden text-sm text-gray-300 md:inline">
                {t('followUs')}:
              </span>
              {socialLinks.map(social => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className={`text-gray-300 transition-colors ${social.color}`}
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
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
