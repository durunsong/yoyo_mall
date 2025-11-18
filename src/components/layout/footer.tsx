/**
 * Footer组件
 * 网站底部，包含链接、联系信息、社交媒体等
 * 从数据库读取配置
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
import { usePathname } from 'next/navigation';

// Footer配置类型
interface FooterLink {
  id: string;
  name: string;
  nameEn?: string;
  nameZh?: string;
  href: string;
  isActive: boolean;
  openInNew: boolean;
}

interface FooterSection {
  id: string;
  key: string;
  title: string;
  titleEn?: string;
  titleZh?: string;
  isActive: boolean;
  links: FooterLink[];
}

interface FooterContact {
  id: string;
  type: string;
  label: string;
  value: string;
  icon?: string;
}

interface FooterSocial {
  id: string;
  name: string;
  icon: string;
  href: string;
  color?: string;
}

interface FooterConfig {
  sections: FooterSection[];
  contacts: FooterContact[];
  socials: FooterSocial[];
}

// 默认Footer链接配置（备用）
const getDefaultFooterLinks = (t: (key: string, params?: Record<string, string | number>) => string) => ({
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

// 默认社交媒体链接（备用）
const defaultSocialLinks = [
  { name: 'Facebook', icon: 'Facebook', href: '#', color: 'hover:text-blue-600' },
  { name: 'Twitter', icon: 'Twitter', href: '#', color: 'hover:text-blue-400' },
  { name: 'Instagram', icon: 'Instagram', href: '#', color: 'hover:text-pink-500' },
  { name: 'YouTube', icon: 'Youtube', href: '#', color: 'hover:text-red-600' },
];

// 图标映射
const iconMap: Record<string, any> = {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
};

export function Footer() {
  const { t } = useStaticTranslations('layout');
  const pathname = usePathname();
  const defaultFooterLinks = useMemo(() => getDefaultFooterLinks(t), [t]);
  
  // 从数据库加载的配置
  const [footerConfig, setFooterConfig] = useState<FooterConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  
  // Newsletter 订阅状态
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // 确保只在客户端渲染动态内容
  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载Footer配置
  useEffect(() => {
    const loadFooterConfig = async () => {
      try {
        const response = await fetch('/api/footer-config');
        if (response.ok) {
          const data = await response.json();
          setFooterConfig(data);
        }
      } catch (error) {
        console.error('加载Footer配置失败:', error);
        // 加载失败时使用默认配置
      } finally {
        setConfigLoaded(true);
      }
    };

    loadFooterConfig();
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
    <footer className="bg-gray-900 text-white w-full overflow-x-hidden">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-blue-100 to-indigo-400 py-12 w-full overflow-x-hidden">
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

            {/* Contact Info - 从数据库加载 */}
            <div className="space-y-2 text-sm text-gray-300">
              {configLoaded && footerConfig?.contacts && footerConfig.contacts.length > 0 ? (
                footerConfig.contacts.map((contact) => {
                  const IconComponent = contact.icon && iconMap[contact.icon] ? iconMap[contact.icon] : Mail;
                  return (
                    <div key={contact.id} className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{contact.value}</span>
                    </div>
                  );
                })
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Footer Links - 从数据库加载或使用默认配置 */}
          {configLoaded && footerConfig?.sections && footerConfig.sections.length > 0 ? (
            footerConfig.sections.map((section) => (
              <div key={section.id}>
                <h4 className="mb-4 font-semibold">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        target={link.openInNew ? '_blank' : undefined}
                        rel={link.openInNew ? 'noopener noreferrer' : undefined}
                        className="text-sm text-gray-300 transition-colors hover:text-white"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            Object.entries(defaultFooterLinks).map(([key, section]) => (
              <div key={key}>
                <h4 className="mb-4 font-semibold">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
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
            ))
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 text-sm text-gray-300 md:mb-0">
              © 2025 Yobuy. {t('footer.allRightsReserved')}
            </div>

            {/* Social Links - 从数据库加载或使用默认配置 */}
            <div className="flex items-center space-x-4">
              <span className="hidden text-sm text-gray-300 md:inline">
                {t('footer.followUs')}:
              </span>
              {(configLoaded && footerConfig?.socials && footerConfig.socials.length > 0
                ? footerConfig.socials
                : defaultSocialLinks
              ).map((social) => {
                const Icon = iconMap[social.icon] || Mail;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-300 transition-colors ${social.color || 'hover:text-white'}`}
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
