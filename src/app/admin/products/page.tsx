/**
 * 管理后台 - 商品管理页面
 * 提供商品的CRUD操作功能
 */

'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Card,
  Typography,
  Tag,
  Image,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  AppstoreOutlined,
  ShopOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useProducts } from '@/hooks/use-products';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ProductFormData {
  name: string;
  description?: string;
  shortDesc?: string;
  sku: string;
  price: number;
  comparePrice?: number;
  categoryId: string;
  brandId?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isDigital: boolean;
  trackInventory: boolean;
  allowOutOfStock: boolean;
  tags: string[],
}

export default function AdminProductsPage() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [form] = Form.useForm();

  // 使用产品Hook
  const { products, pagination, loading, refetch } = useProducts({
    search: searchText,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    limit: 10,
  });

  // 计算统计数据
  const totalProducts = pagination?.total || 0;
  const publishedProducts = products.filter(p => p.status === 'PUBLISHED').length;
  const draftProducts = products.filter(p => p.status === 'DRAFT').length;
  const lowStockProducts = products.filter(p => p.isLowStock).length;

  // 表格列定义
  const columns: ColumnsType<any> = [
    {
      title: '商品图片',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: any[]) => (
        <Image
          src={images?.[0]?.url || '/placeholder-product.jpg'}
          alt="商品图片"
          width={60}
          height={60}
          className="object-cover rounded"
          placeholder={<div className="w-15 h-15 bg-gray-200 rounded"></div>}
        />
      ),
    },
    {
      title: '商品信息',
      key: 'info',
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.name}</div>
          <div className="text-gray-500 text-sm">SKU: {record.sku}</div>
          {record.brand && (
            <div className="text-gray-400 text-xs">{record.brand.name}</div>
          )}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 120,
    },
    {
      title: '价格',
      key: 'price',
      width: 120,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-red-500">
            ${record.price.toFixed(2)}
          </div>
          {record.comparePrice && record.comparePrice > record.price && (
            <div className="text-gray-400 text-sm line-through">
              ${record.comparePrice.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '库存',
      key: 'stock',
      width: 100,
      render: (_, record) => (
        <div>
          <div>{record.availableQuantity}</div>
          {record.isLowStock && (
                  <Tag color="orange">库存紧张</Tag>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          PUBLISHED: { color: 'green', text: '已发布' },
          DRAFT: { color: 'orange', text: '草稿' },
          ARCHIVED: { color: 'red', text: '已归档' },
        };
        const config = statusMap[status as keyof typeof statusMap];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: '评分',
      key: 'rating',
      width: 100,
      render: (_, record) => (
        <div>
          <div>⭐ {record.averageRating.toFixed(1)}</div>
          <div className="text-gray-400 text-xs">({record.reviewCount})</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这个商品吗？"
            description="此操作无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理搜索
  const handleSearch = () => {
    refetch({
      search: searchText,
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
    });
  };

  // 处理创建商品
  const handleCreate = () => {
    setModalMode('create');
    setSelectedProduct(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 处理编辑商品
  const handleEdit = (product: any) => {
    setModalMode('edit');
    setSelectedProduct(product);
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      shortDesc: product.shortDesc,
      sku: product.sku,
      price: product.price,
      comparePrice: product.comparePrice,
      categoryId: product.category.id,
      brandId: product.brand?.id,
      status: product.status,
      isDigital: product.isDigital,
      trackInventory: product.trackInventory,
      allowOutOfStock: product.allowOutOfStock,
      tags: product.tags,
    });
    setIsModalOpen(true);
  };

  // 处理查看商品
  const handleView = (product: any) => {
    setModalMode('view');
    setSelectedProduct(product);
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      shortDesc: product.shortDesc,
      sku: product.sku,
      price: product.price,
      comparePrice: product.comparePrice,
      categoryId: product.category.id,
      brandId: product.brand?.id,
      status: product.status,
      isDigital: product.isDigital,
      trackInventory: product.trackInventory,
      allowOutOfStock: product.allowOutOfStock,
      tags: product.tags,
    });
    setIsModalOpen(true);
  };

  // 处理删除商品
  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        message.success('商品删除成功');
        refetch();
      } else {
        const result = await response.json();
        message.error(result.message || '删除失败');
      }
    } catch {
      message.error('网络错误，请重试');
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: ProductFormData) => {
    try {
      const url = modalMode === 'create' 
        ? '/api/products' 
        : `/api/products/${selectedProduct.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(modalMode === 'create' ? '商品创建成功' : '商品更新成功');
        setIsModalOpen(false);
        refetch();
      } else {
        const result = await response.json();
        message.error(result.message || '操作失败');
      }
    } catch {
      message.error('网络错误，请重试');
    }
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2}>商品管理</Title>
        <Text type="secondary">管理您的商品信息、库存和状态</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="总商品数"
              value={totalProducts}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发布"
              value={publishedProducts}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="草稿"
              value={draftProducts}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="库存警告"
              value={lowStockProducts}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作工具栏 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="middle">
              <Input
                placeholder="搜索商品名称或SKU"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                placeholder="状态"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                allowClear
              >
                <Option value="PUBLISHED">已发布</Option>
                <Option value="DRAFT">草稿</Option>
                <Option value="ARCHIVED">已归档</Option>
              </Select>
              <Select
                placeholder="分类"
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="electronics">数码电子</Option>
                <Option value="fashion">时尚服饰</Option>
                <Option value="home-living">家居生活</Option>
                <Option value="beauty">美妆护肤</Option>
              </Select>
              <Button icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加商品
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 商品表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination?.page,
            total: pagination?.total,
            pageSize: pagination?.limit,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} 共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 商品表单模态框 */}
      <Modal
        title={
          modalMode === 'create' ? '添加商品' :
          modalMode === 'edit' ? '编辑商品' : '查看商品'
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={modalMode === 'view' ? [
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            关闭
          </Button>
        ] : [
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {modalMode === 'create' ? '创建' : '更新'}
          </Button>
        ]}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={modalMode === 'view'}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="商品名称"
                rules={[{ required: true, message: '请输入商品名称' }]}
              >
                <Input placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: '请输入SKU' }]}
              >
                <Input placeholder="请输入SKU" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="shortDesc" label="简短描述">
            <Input placeholder="请输入简短描述" />
          </Form.Item>

          <Form.Item name="description" label="详细描述">
            <TextArea rows={4} placeholder="请输入详细描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="价格"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  addonBefore="$"
                  placeholder="0.00"
                  className="w-full"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="comparePrice" label="对比价格">
                <InputNumber
                  min={0}
                  precision={2}
                  addonBefore="$"
                  placeholder="0.00"
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
                  <Option value="electronics">数码电子</Option>
                  <Option value="fashion">时尚服饰</Option>
                  <Option value="home-living">家居生活</Option>
                  <Option value="beauty">美妆护肤</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Option value="DRAFT">草稿</Option>
                  <Option value="PUBLISHED">已发布</Option>
                  <Option value="ARCHIVED">已归档</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isDigital" valuePropName="checked">
                <Switch /> 数字商品
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="trackInventory" valuePropName="checked">
                <Switch /> 跟踪库存
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="allowOutOfStock" valuePropName="checked">
                <Switch /> 允许缺货销售
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}