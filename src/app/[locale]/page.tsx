/**
 * 首页组件 - 使用Ant Design
 * 网站主页，展示特色商品、分类、优惠活动等
 */

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Space,
  Statistic 
} from 'antd';
import {
  ShoppingOutlined,
  SafetyOutlined,
  RocketOutlined,
  CrownOutlined,
  MobileOutlined,
  HomeOutlined,
  SkinOutlined
} from '@ant-design/icons';

export default function HomePage() {
  const t = useTranslations('home');
  const common = useTranslations('common');
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <Row align="middle" justify="center">
            <Col xs={24} lg={16} className="text-center">
              <h1 className="text-white mb-6" style={{ fontSize: '3.5rem', marginBottom: '24px' }}>
                {t('hero.title')}
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                {t('hero.subtitle')}
              </p>
              <Space size="large">
                <Button type="primary" size="large" className="bg-white text-blue-600 border-white hover:bg-blue-50">
                  <Link href="/products">{t('hero.shopNow')}</Link>
                </Button>
                <Button ghost size="large">
                  <Link href="/about">{t('hero.learnMore')}</Link>
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('features.title')}</h2>
            <p className="text-lg text-gray-600">
              {t('features.subtitle')}
            </p>
          </div>
          
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Card className="h-full text-center hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <ShoppingOutlined className="text-blue-500 text-5xl" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{t('features.quality.title')}</h4>
                <p className="text-gray-600">
                  {t('features.quality.description')}
                </p>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card className="h-full text-center hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <SafetyOutlined className="text-green-500 text-5xl" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{t('features.secure.title')}</h4>
                <p className="text-gray-600">
                  {t('features.secure.description')}
                </p>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card className="h-full text-center hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <RocketOutlined className="text-purple-500 text-5xl" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{t('features.fast.title')}</h4>
                <p className="text-gray-600">
                  {t('features.fast.description')}
                </p>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('categories.title')}</h2>
            <p className="text-lg text-gray-600">
              精选优质商品分类，满足您的不同需求
            </p>
          </div>

          <Row gutter={[24, 24]}>
            {[
              { name: t('categories.fashion'), href: '/products?category=clothing', icon: CrownOutlined, count: 256 },
              { name: t('categories.electronics'), href: '/products?category=electronics', icon: MobileOutlined, count: 189 },
              { name: t('categories.home'), href: '/products?category=home', icon: HomeOutlined, count: 432 },
              { name: t('categories.beauty'), href: '/products?category=beauty', icon: SkinOutlined, count: 98 },
            ].map((category) => {
              const IconComponent = category.icon;
              return (
                <Col xs={12} sm={6} key={category.name}>
                  <Card 
                    className="text-center hover:shadow-md transition-all cursor-pointer"
                    hoverable
                  >
                    <Link href={category.href}>
                      <div className="text-4xl mb-3 text-blue-500">
                        <IconComponent />
                      </div>
                      <h5 className="text-lg font-medium text-gray-900 mb-2">{category.name}</h5>
                      <p className="text-gray-500 text-sm">{category.count} 件商品</p>
                    </Link>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Row gutter={[32, 32]} justify="center">
            <Col xs={12} sm={6}>
              <div className="text-center">
                <Statistic
                  title={t('stats.users')}
                  value={1200000}
                  precision={0}
                  valueStyle={{ color: '#3f8600', fontSize: '2rem' }}
                  suffix="+"
                />
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="text-center">
                <Statistic
                  title={t('stats.products')}
                  value={50000}
                  precision={0}
                  valueStyle={{ color: '#cf1322', fontSize: '2rem' }}
                  suffix="+"
                />
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="text-center">
                <Statistic
                  title={t('stats.brands')}
                  value={2000}
                  precision={0}
                  valueStyle={{ color: '#1890ff', fontSize: '2rem' }}
                  suffix="+"
                />
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="text-center">
                <Statistic
                  title={t('stats.satisfaction')}
                  value={98.5}
                  precision={1}
                  valueStyle={{ color: '#722ed1', fontSize: '2rem' }}
                  suffix="%"
                />
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('cta.subtitle')}
          </p>
          <Space size="large">
            <Button type="primary" size="large" className="bg-white text-blue-600 border-white">
              <Link href="/register">{t('cta.register')}</Link>
            </Button>
            <Button ghost size="large">
              <Link href="/products">{t('cta.browse')}</Link>
            </Button>
          </Space>
        </div>
      </section>
    </div>
  );
}