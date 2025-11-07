/**
 * Footer组件
 * 网站底部，包含链接、联系信息、社交媒体等
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

// Footer链接配置函数 - 使用 layout 命名空间
const getFooterLinks = (t: (key: string, params?: Record<string, string | number>) => string) => ({
  company: {
    title: t('footer.sections.company.title'),
    links: [
      { name: t('footer.sections.company.links.about'), href: '/about' },
      { name: t('footer.sections.company.links.contact'), href: '/contact' },
      { name: t('footer.sections.company.links.careers'), href: '/careers' },
      { name: t('footer.sections.company.links.news'), href: '/news' },
    ],
  },
  customer: {
    title: t('footer.sections.customer.title'),
    links: [
      { name: t('footer.sections.customer.links.help'), href: '/help' },
      { name: t('footer.sections.customer.links.shipping'), href: '/shipping' },
      { name: t('footer.sections.customer.links.returns'), href: '/returns' },
      { name: t('footer.sections.customer.links.faq'), href: '/faq' },
    ],
  },
  account: {
    title: t('footer.sections.account.title'),
    links: [
      { name: t('footer.sections.account.links.orders'), href: '/account/orders' },
      { name: t('footer.sections.account.links.wishlist'), href: '/account/wishlist' },
      { name: t('footer.sections.account.links.settings'), href: '/account/settings' },
      { name: t('footer.sections.account.links.addresses'), href: '/account/addresses' },
    ],
  },
  legal: {
    title: t('footer.sections.legal.title'),
    links: [
      { name: t('footer.sections.legal.links.terms'), href: '/terms' },
      { name: t('footer.sections.legal.links.privacy'), href: '/privacy' },
      { name: t('footer.sections.legal.links.cookies'), href: '/cookies' },
      { name: t('footer.sections.legal.links.disclaimer'), href: '/disclaimer' },
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
  const { t } = useStaticTranslations('layout');
  const footerLinks = useMemo(() => getFooterLinks(t), [t]);
  
  // Newsletter 订阅状态
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // 确保只在客户端渲染动态内容
  useEffect(() => {
    setMounted(true);
  }, []);

  // 处理订阅提交
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: t('footer.newsletter.message.emailRequired') });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source: 'footer' }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message || t('footer.newsletter.message.success'),
        });
        setEmail(''); // 清空输入框
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || t('footer.newsletter.message.error'), 
        });
      }
    } catch (error) {
      console.error('订阅失败:', error);
      setMessage({ type: 'error', text: t('footer.newsletter.message.error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-blue-100 to-indigo-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="mb-2 text-2xl font-bold text-blue-400" suppressHydrationWarning>
                {mounted ? t('footer.newsletter.title') : ''}
              </h3>
              <p className="text-blue-400" suppressHydrationWarning>
                {mounted ? t('footer.newsletter.subtitle') : ''}
              </p>
            </div>
            <div className="w-full md:w-auto">
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <div className="flex w-full md:w-auto">
                  <input
                    type="email"
                    placeholder={mounted ? t('footer.newsletter.inputPlaceholder') : ''}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="email"
                    data-lpignore="true"
                    data-form-type="other"
                    className="flex-1 rounded-l-lg border-2 border-white bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 disabled:bg-gray-100 disabled:cursor-not-allowed md:w-80"
                  />
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-r-lg bg-white px-8 py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSubmitting
                      ? t('footer.newsletter.buttonLoading')
                      : mounted
                        ? t('footer.newsletter.button')
                        : ''}
                  </button>
                </div>
                {message && (
                  <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-200' : 'text-yellow-200'}`}>
                    {message.text}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/icons/web-logo.svg"
                  alt="Yobuy"
                  width={160}
                  height={50}
                  className="h-8 w-auto"
                />
                <span className="sr-only">Yobuy</span>
              </Link>
            </div>
            <p className="mb-4 text-sm text-gray-300">
              {t('footer.companyDescription')}
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
      <div className="shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 text-sm text-gray-300 md:mb-0">
              © 2025 Yobuy. {t('footer.allRightsReserved')}
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="hidden text-sm text-gray-300 md:inline">
                {t('footer.followUs')}:
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
