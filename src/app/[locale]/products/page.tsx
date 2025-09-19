/**
 * 商品列表页面
 * 展示所有商品，支持搜索、筛选和分页
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Select, 
  Slider, 
  Button, 
  Pagination, 
  Spin, 
  Empty, 
  Space,
  Typography,
  Breadcrumb,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  AppstoreOutlined,
  BarsOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useProducts, type ProductQuery } from '@/hooks/use-products';
import ProductCard from '@/components/products/product-card';

const { Option } = Select;
const { Title, Text } = Typography;

// 排序选项
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: '最新上架' },
  { value: 'price:asc', label: '价格从低到高' },
  { value: 'price:desc', label: '价格从高到低' },
  { value: 'name:asc', label: '名称A-Z' },
  { value: 'name:desc', label: '名称Z-A' },
];

// 每页商品数选项
const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 从URL参数初始化查询条件
  const [query, setQuery] = useState<ProductQuery>(() => ({
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 24,
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  }));

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [tempSearch, setTempSearch] = useState(query.search || '');

  const { products, pagination, loading, error, refetch } = useProducts(query);

  // 更新URL参数
  const updateURL = (newQuery: ProductQuery) => {
    const params = new URLSearchParams();
    
    Object.entries(newQuery).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  // 处理查询参数变化
  const handleQueryChange = (updates: Partial<ProductQuery>) => {
    const newQuery = { ...query, ...updates, page: 1 }; // 重置到第一页
    setQuery(newQuery);
    updateURL(newQuery);
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    const newQuery = { ...query, page };
    setQuery(newQuery);
    updateURL(newQuery);
  };

  // 处理搜索
  const handleSearch = () => {
    handleQueryChange({ search: tempSearch });
  };

  // 处理排序变化
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':');
    handleQueryChange({ sortBy: sortBy as any, sortOrder: sortOrder as any });
  };

  // 处理价格范围变化
  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value);
    handleQueryChange({ 
      minPrice: value[0] > 0 ? value[0] : undefined,
      maxPrice: value[1] < 1000 ? value[1] : undefined 
    });
  };

  // 清除筛选条件
  const clearFilters = () => {
    setTempSearch('');
    setPriceRange([0, 1000]);
    const newQuery: ProductQuery = {
      page: 1,
      limit: query.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setQuery(newQuery);
    updateURL(newQuery);
  };

  // 监听URL参数变化
  useEffect(() => {
    const urlQuery: ProductQuery = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 24,
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    };
    
    setQuery(urlQuery);
    setTempSearch(urlQuery.search || '');
    
    if (urlQuery.minPrice || urlQuery.maxPrice) {
      setPriceRange([urlQuery.minPrice || 0, urlQuery.maxPrice || 1000]);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 面包屑导航 */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <Link href="/">
            <HomeOutlined /> 首页
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>商品列表</Breadcrumb.Item>
        {query.category && (
          <Breadcrumb.Item>{query.category}</Breadcrumb.Item>
        )}
      </Breadcrumb>

      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2}>商品列表</Title>
        {pagination && (
          <Text type="secondary">
            共找到 {pagination.total} 件商品
          </Text>
        )}
      </div>

      <Row gutter={24}>
        {/* 筛选侧边栏 */}
        <Col xs={24} md={6} className="mb-6">
          <Card title="筛选条件" size="small">
            <Space direction="vertical" className="w-full">
              {/* 搜索 */}
              <div>
                <Text strong className="block mb-2">搜索</Text>
                <Input.Search
                  placeholder="搜索商品..."
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  onSearch={handleSearch}
                  onPressEnter={handleSearch}
                />
              </div>

              <Divider />

              {/* 价格范围 */}
              <div>
                <Text strong className="block mb-2">价格范围</Text>
                <Slider
                  range
                  min={0}
                  max={1000}
                  value={priceRange}
                  onChange={setPriceRange}
                  onAfterChange={handlePriceRangeChange}
                  tooltip={{
                    formatter: (value) => `$${value}`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>

              <Divider />

              {/* 清除筛选 */}
              <Button 
                icon={<ClearOutlined />} 
                onClick={clearFilters}
                className="w-full"
              >
                清除筛选
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 商品列表 */}
        <Col xs={24} md={18}>
          {/* 工具栏 */}
          <Card className="mb-4" size="small">
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Text>排序：</Text>
                  <Select
                    value={`${query.sortBy}:${query.sortOrder}`}
                    onChange={handleSortChange}
                    style={{ width: 160 }}
                  >
                    {SORT_OPTIONS.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>

                  <Text>每页：</Text>
                  <Select
                    value={query.limit}
                    onChange={(value) => handleQueryChange({ limit: value })}
                    style={{ width: 80 }}
                  >
                    {PAGE_SIZE_OPTIONS.map(size => (
                      <Option key={size} value={size}>{size}</Option>
                    ))}
                  </Select>
                </Space>
              </Col>

              <Col>
                <Button.Group>
                  <Button
                    type={viewMode === 'grid' ? 'primary' : 'default'}
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode('grid')}
                  />
                  <Button
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    icon={<BarsOutlined />}
                    onClick={() => setViewMode('list')}
                  />
                </Button.Group>
              </Col>
            </Row>
          </Card>

          {/* 商品网格 */}
          {loading ? (
            <div className="text-center py-20">
              <Spin size="large" tip="加载中..." />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <Empty
                description={
                  <span>
                    {error}
                    <br />
                    <Button type="primary" onClick={() => refetch()}>
                      重试
                    </Button>
                  </span>
                }
              />
            </div>
          ) : products.length === 0 ? (
            <Empty
              description="没有找到商品"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {products.map((product) => (
                  <Col
                    key={product.id}
                    xs={viewMode === 'grid' ? 12 : 24}
                    sm={viewMode === 'grid' ? 8 : 24}
                    md={viewMode === 'grid' ? 8 : 24}
                    lg={viewMode === 'grid' ? 6 : 24}
                  >
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>

              {/* 分页 */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 text-center">
                  <Pagination
                    current={pagination.page}
                    total={pagination.total}
                    pageSize={pagination.limit}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} 共 ${total} 件商品`
                    }
                  />
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}