/**
 * 使用Ant Design的首页组件
 */

'use client';

import Link from 'next/link';
import {
  Layout,
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Carousel,
  Statistic,
  Badge,
  Rate,
} from 'antd';
import {
  ShoppingOutlined,
  SafetyOutlined,
  RocketOutlined,
  StarFilled,
  ArrowRightOutlined,
  TagOutlined,
  MobileOutlined,
  LaptopOutlined,
  HomeOutlined,
  CrownOutlined,
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

export default function AntdHomePage() {
  // 特色服务数据
  const features = [
    {
      icon: <ShoppingOutlined className="text-3xl text-blue-500" />,
      title: '全球直采',
      description: '直接与全球优质供应商合作，确保商品品质和价格优势',
    },
    {
      icon: <SafetyOutlined className="text-3xl text-green-500" />,
      title: '安全保障',
      description: '多重支付保护，7天无理由退货，让您购物无忧',
    },
    {
      icon: <RocketOutlined className="text-3xl text-purple-500" />,
      title: '快速配送',
      description: '与国际知名物流合作，提供快速可靠的全球配送服务',
    },
  ];

  // 商品分类
  const categories = [
    {
      name: '服装配饰',
      icon: <CrownOutlined />,
      href: '/products?category=clothing',
      count: 256,
    },
    {
      name: '数码产品',
      icon: <MobileOutlined />,
      href: '/products?category=electronics',
      count: 189,
    },
    {
      name: '家居生活',
      icon: <HomeOutlined />,
      href: '/products?category=home',
      count: 432,
    },
    {
      name: '电脑办公',
      icon: <LaptopOutlined />,
      href: '/products?category=computer',
      count: 98,
    },
  ];

  // 热门商品
  const products = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      price: 999,
      originalPrice: 1099,
      image: '/placeholder-product.jpg',
      rating: 4.8,
      reviews: 256,
      badge: '特价',
    },
    {
      id: 2,
      name: 'MacBook Air M3',
      price: 1199,
      originalPrice: null,
      image: '/placeholder-product.jpg',
      rating: 4.9,
      reviews: 189,
      badge: '热销',
    },
    {
      id: 3,
      name: 'AirPods Pro',
      price: 249,
      originalPrice: 279,
      image: '/placeholder-product.jpg',
      rating: 4.7,
      reviews: 432,
      badge: '推荐',
    },
    {
      id: 4,
      name: 'iPad Air',
      price: 599,
      originalPrice: null,
      image: '/placeholder-product.jpg',
      rating: 4.6,
      reviews: 123,
      badge: '新品',
    },
  ];

  return (
    <Content>
      {/* Hero轮播图 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <Row align="middle" gutter={[48, 24]}>
            <Col xs={24} lg={12}>
              <div className="text-center lg:text-left">
                <Title
                  level={1}
                  className="mb-6 text-white"
                  style={{ fontSize: '3rem' }}
                >
                  欢迎来到 YOYO Mall
                </Title>
                <Paragraph className="mb-8 text-xl text-blue-100">
                  发现全球优质商品，享受安全便捷的跨境购物体验
                </Paragraph>
                <Space size="large">
                  <Button
                    type="primary"
                    size="large"
                    className="border-white bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <Link href="/products">开始购物</Link>
                  </Button>
                  <Button ghost size="large">
                    <Link href="/about">了解更多</Link>
                  </Button>
                </Space>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="text-center">
                <div className="inline-block rounded-2xl bg-white/10 p-8">
                  <ShoppingOutlined className="text-8xl text-white/80" />
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Row gutter={[32, 32]} justify="center">
            <Col xs={12} sm={6}>
              <div className="text-center">
                <Statistic
                  title="全球用户"
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
                  title="商品种类"
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
                  title="合作品牌"
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
                  title="客户满意度"
                  value={98.5}
                  precision={1}
                  valueStyle={{ color: '#722ed1', fontSize: '2rem' }}
                  suffix="%"
                />
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* 特色服务 */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Title level={2}>为什么选择我们</Title>
            <Paragraph className="text-lg text-gray-600">
              专业的跨境电商平台，为您提供最优质的购物体验
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <Card className="h-full text-center transition-shadow hover:shadow-lg">
                  <div className="mb-4">{feature.icon}</div>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph className="text-gray-600">
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* 商品分类 */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Title level={2}>热门分类</Title>
            <Paragraph className="text-lg text-gray-600">
              精选优质商品分类，满足您的不同需求
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {categories.map((category, index) => (
              <Col xs={12} sm={6} key={index}>
                <Card
                  className="cursor-pointer text-center transition-all hover:shadow-md"
                  hoverable
                >
                  <Link href={category.href}>
                    <div className="mb-3 text-4xl text-blue-500">
                      {category.icon}
                    </div>
                    <Title level={5} className="mb-2">
                      {category.name}
                    </Title>
                    <Text type="secondary">{category.count} 件商品</Text>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* 热门商品 */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2">
                热门商品
              </Title>
              <Paragraph className="text-lg text-gray-600">
                精选热销商品，品质保证
              </Paragraph>
            </div>
            <Button type="primary" size="large">
              <Link href="/products">
                查看更多 <ArrowRightOutlined />
              </Link>
            </Button>
          </div>

          <Row gutter={[24, 24]}>
            {products.map(product => (
              <Col xs={24} sm={12} lg={6} key={product.id}>
                <Badge.Ribbon text={product.badge} color="red">
                  <Card
                    hoverable
                    className="h-full"
                    cover={
                      <div className="flex h-48 items-center justify-center bg-gray-100">
                        <Text type="secondary">商品图片</Text>
                      </div>
                    }
                    actions={[
                      <Button key="cart" type="primary" block>
                        加入购物车
                      </Button>,
                    ]}
                  >
                    <Meta
                      title={
                        <div>
                          <Text strong className="mb-2 block">
                            {product.name}
                          </Text>
                          <div className="mb-2 flex items-center">
                            <Rate
                              disabled
                              defaultValue={product.rating}
                              className="text-sm"
                            />
                            <Text type="secondary" className="ml-2">
                              ({product.reviews})
                            </Text>
                          </div>
                        </div>
                      }
                      description={
                        <div className="flex items-center justify-between">
                          <div>
                            <Text strong className="text-lg text-red-500">
                              ${product.price}
                            </Text>
                            {product.originalPrice && (
                              <Text delete type="secondary" className="ml-2">
                                ${product.originalPrice}
                              </Text>
                            )}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* CTA区域 */}
      <div className="bg-blue-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Title level={2} className="mb-4 text-white">
            准备开始购物了吗？
          </Title>
          <Paragraph className="mb-8 text-xl text-blue-100">
            加入我们的会员，享受更多优惠和专属服务
          </Paragraph>
          <Space size="large">
            <Button
              type="primary"
              size="large"
              className="border-white bg-white text-blue-600"
            >
              <Link href="/register">立即注册</Link>
            </Button>
            <Button ghost size="large">
              <Link href="/products">浏览商品</Link>
            </Button>
          </Space>
        </div>
      </div>
    </Content>
  );
}
