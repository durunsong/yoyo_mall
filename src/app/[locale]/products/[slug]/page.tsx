/**
 * 商品详情页面
 * 展示单个商品的详细信息
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Row,
  Col,
  Card,
  Button,
  InputNumber,
  Rate,
  Tag,
  Divider,
  Breadcrumb,
  Typography,
  Space,
  Badge,
  Tabs,
  Avatar,
  Spin,
  Alert,
  Select,
  message
} from 'antd';
import {
  ShoppingCartOutlined,
  HeartOutlined,
  ShareAltOutlined,
  SafetyCertificateOutlined,
  TruckOutlined,
  HomeOutlined,
  StarFilled
} from '@ant-design/icons';
import { useProduct } from '@/hooks/use-products';
import { useCartApi } from '@/hooks/use-cart-api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = React.use(params);
  const { slug } = resolvedParams;
  
  // 根据slug获取商品ID（实际项目中应该有slug到ID的映射API）
  const { product, loading, error, refetch } = useProduct(slug);
  const { addToCart } = useCartApi();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // 如果商品不存在，显示错误
  if (error && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert
          message="商品不存在"
          description="您访问的商品不存在或已下架"
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={refetch}>重试</Button>
              <Link href="/products">
                <Button type="primary" size="small">返回商品列表</Button>
              </Link>
            </Space>
          }
        />
      </div>
    );
  }

  // 加载中状态
  if (loading || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    );
  }

  // 处理添加到购物车
  const handleAddToCart = async () => {
    setAddingToCart(true);
    const success = await addToCart(product.id, quantity, selectedVariant);
    if (success) {
      message.success(`已将 ${quantity} 件商品添加到购物车`);
    }
    setAddingToCart(false);
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency,
    }).format(price);
  };

  // 计算折扣百分比
  const discountPercentage = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  // 获取当前选中变体的价格
  const getCurrentPrice = () => {
    if (selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.id === selectedVariant);
      return variant?.price || product.price;
    }
    return product.price;
  };

  // 获取当前可用库存
  const getAvailableStock = () => {
    if (selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.id === selectedVariant);
      // 这里需要根据实际的variant库存数据结构调整
      return product.availableQuantity; // 临时使用商品库存
    }
    return product.availableQuantity;
  };

  const availableStock = getAvailableStock();

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 面包屑导航 */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <Link href="/">
            <HomeOutlined /> 首页
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link href="/products">商品列表</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link href={`/products?category=${product.category.slug}`}>
            {product.category.name}
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{product.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={32}>
        {/* 商品图片 */}
        <Col xs={24} md={12}>
          <div className="space-y-4">
            {/* 主图 */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {discountPercentage > 0 && (
                <Badge.Ribbon 
                  text={`-${discountPercentage}%`} 
                  color="red"
                  className="absolute top-0 right-0 z-10"
                />
              )}
              <Image
                src={product.images[selectedImageIndex]?.url || '/placeholder-product.jpg'}
                alt={product.images[selectedImageIndex]?.alt || product.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* 缩略图 */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`relative w-20 h-20 bg-gray-100 rounded cursor-pointer border-2 transition-all ${
                      index === selectedImageIndex 
                        ? 'border-blue-500' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>

        {/* 商品信息 */}
        <Col xs={24} md={12}>
          <div className="space-y-6">
            {/* 品牌和标题 */}
            <div>
              {product.brand && (
                <Text type="secondary" className="text-sm">
                  {product.brand.name}
                </Text>
              )}
              <Title level={1} className="!mt-1 !mb-2">
                {product.name}
              </Title>
              <Text type="secondary">{product.shortDesc}</Text>
            </div>

            {/* 评分和评论 */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-4">
                <Rate disabled defaultValue={product.averageRating} allowHalf />
                <Text>
                  <span className="font-semibold">{product.averageRating.toFixed(1)}</span>
                  <span className="text-gray-500 ml-1">({product.reviewCount} 条评论)</span>
                </Text>
              </div>
            )}

            {/* 价格 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Text className="text-3xl font-bold text-red-500">
                  {formatPrice(getCurrentPrice())}
                </Text>
                {product.comparePrice && product.comparePrice > getCurrentPrice() && (
                  <Text delete type="secondary" className="text-lg">
                    {formatPrice(product.comparePrice)}
                  </Text>
                )}
              </div>
              {discountPercentage > 0 && (
                <Tag color="red">省 {formatPrice(product.comparePrice! - getCurrentPrice())}</Tag>
              )}
            </div>

            {/* SKU和库存状态 */}
            <div className="space-y-2">
              <Text type="secondary">SKU: {product.sku}</Text>
              <div className="flex items-center gap-2">
                <Text>库存状态:</Text>
                {product.inStock ? (
                  <Tag color="green">
                    有货 ({availableStock} 件可用)
                  </Tag>
                ) : (
                  <Tag color="red">缺货</Tag>
                )}
                {product.isLowStock && (
                  <Tag color="orange">库存紧张</Tag>
                )}
              </div>
            </div>

            {/* 变体选择 */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <Text strong>选择规格:</Text>
                <Select
                  placeholder="请选择规格"
                  value={selectedVariant}
                  onChange={setSelectedVariant}
                  className="w-full"
                >
                  {product.variants.map(variant => (
                    <Option key={variant.id} value={variant.id}>
                      <Space>
                        <span>{variant.name}</span>
                        <Text type="secondary">
                          {formatPrice(variant.price)}
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            {/* 数量选择和添加到购物车 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Text strong>数量:</Text>
                <InputNumber
                  min={1}
                  max={availableStock}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                  disabled={!product.inStock}
                />
                <Text type="secondary">
                  最大可购买 {availableStock} 件
                </Text>
              </div>

              <Space size="middle" className="w-full">
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  loading={addingToCart}
                  disabled={!product.inStock || quantity > availableStock}
                  onClick={handleAddToCart}
                  className="flex-1"
                >
                  加入购物车
                </Button>
                <Button
                  size="large"
                  icon={<HeartOutlined />}
                >
                  收藏
                </Button>
                <Button
                  size="large"
                  icon={<ShareAltOutlined />}
                >
                  分享
                </Button>
              </Space>
            </div>

            {/* 服务保障 */}
            <Card size="small" className="bg-gray-50">
              <Space direction="vertical" className="w-full">
                <div className="flex items-center gap-2">
                  <SafetyCertificateOutlined className="text-green-500" />
                  <Text>7天无理由退货</Text>
                </div>
                <div className="flex items-center gap-2">
                  <TruckOutlined className="text-blue-500" />
                  <Text>满$99免运费</Text>
                </div>
              </Space>
            </Card>

            {/* 标签 */}
            {product.tags.length > 0 && (
              <div>
                <Text strong className="block mb-2">商品标签:</Text>
                <Space wrap>
                  {product.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* 详细信息标签页 */}
      <div className="mt-12">
        <Tabs defaultActiveKey="description">
          <TabPane tab="商品详情" key="description">
            <Card>
              {product.description ? (
                <Paragraph>
                  {product.description}
                </Paragraph>
              ) : (
                <Text type="secondary">暂无详细描述</Text>
              )}
            </Card>
          </TabPane>

          <TabPane tab={`用户评价 (${product.reviewCount})`} key="reviews">
            <Card>
              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-4">
                  {product.reviews.map(review => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Avatar src={review.user.avatar} size="large">
                          {review.user.name?.charAt(0)}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Text strong>{review.user.name}</Text>
                            <Rate disabled defaultValue={review.rating} size="small" />
                          </div>
                          {review.title && (
                            <Title level={5} className="!mt-0 !mb-1">
                              {review.title}
                            </Title>
                          )}
                          {review.content && (
                            <Paragraph className="!mb-1">
                              {review.content}
                            </Paragraph>
                          )}
                          <Text type="secondary" className="text-sm">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无评价</Text>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}
