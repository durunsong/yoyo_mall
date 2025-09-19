/**
 * 商品管理页面 - Ant Design版本
 * 集成OSS图片上传功能
 */

'use client';

import { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  Popconfirm,
  message,
  Avatar,
  Tooltip,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  AppstoreOutlined,
  ExportOutlined,
  ImportOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ImageUpload } from '@/components/ui/image-upload';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// 商品数据类型
interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  brand: string;
  status: 'published' | 'draft' | 'inactive';
  images: Array<{
    url: string;
    key: string;
    thumbnailUrl?: string;
    originalName: string;
  }>;
  description?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsAntdPage() {
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // 模拟商品数据
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'iPhone 15 Pro 钛金属',
      sku: 'IPHONE-15-PRO-128GB-TITANIUM',
      price: 999.0,
      originalPrice: 1099.0,
      stock: 50,
      category: '手机数码',
      brand: 'Apple',
      status: 'published',
      images: [
        {
          url: 'https://example.com/iphone15pro.jpg',
          key: 'products/iphone15pro.jpg',
          thumbnailUrl: 'https://example.com/iphone15pro_thumb.jpg',
          originalName: 'iphone15pro.jpg',
        },
      ],
      description: '全新iPhone 15 Pro，搭载A17 Pro芯片',
      featured: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: '2',
      name: 'MacBook Air M3 13英寸',
      sku: 'MBA-M3-13-256GB-SILVER',
      price: 1199.0,
      stock: 25,
      category: '电脑办公',
      brand: 'Apple',
      status: 'published',
      images: [
        {
          url: 'https://example.com/macbook-air-m3.jpg',
          key: 'products/macbook-air-m3.jpg',
          originalName: 'macbook-air-m3.jpg',
        },
      ],
      description: '轻薄便携的MacBook Air，配备M3芯片',
      featured: false,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
    },
    {
      id: '3',
      name: 'AirPods Pro 第三代',
      sku: 'AIRPODS-PRO-3-WHITE',
      price: 249.0,
      stock: 100,
      category: '音频设备',
      brand: 'Apple',
      status: 'draft',
      images: [],
      description: '主动降噪无线耳机',
      featured: false,
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20',
    },
  ]);

  // 表格列定义
  const columns: ColumnsType<Product> = [
    {
      title: '商品图片',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: Product['images']) => (
        <Avatar
          size={60}
          shape="square"
          src={images[0]?.thumbnailUrl || images[0]?.url}
          icon={<AppstoreOutlined />}
        />
      ),
    },
    {
      title: '商品信息',
      key: 'info',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          <Text type="secondary" className="text-sm">
            SKU: {record.sku}
          </Text>
          <br />
          <Text type="secondary" className="text-sm">
            {record.brand} • {record.category}
          </Text>
        </div>
      ),
    },
    {
      title: '价格',
      key: 'price',
      render: (_, record) => (
        <div>
          <div className="font-medium text-red-500">${record.price}</div>
          {record.originalPrice && (
            <Text delete type="secondary" className="text-sm">
              ${record.originalPrice}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <Tag color={stock > 20 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock > 0 ? `${stock} 件` : '缺货'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Product['status']) => {
        const statusConfig = {
          published: { color: 'green', text: '已发布' },
          draft: { color: 'orange', text: '草稿' },
          inactive: { color: 'red', text: '已下架' },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '特色商品',
      dataIndex: 'featured',
      key: 'featured',
      render: (featured: boolean) => (
        <Tag color={featured ? 'gold' : 'default'}>
          {featured ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个商品吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 处理函数
  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      images: product.images,
    });
    setModalVisible(true);
  };

  const handleView = (product: Product) => {
    message.info(`查看商品: ${product.name}`);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    message.success('商品删除成功');
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);

      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingProduct) {
        // 更新商品
        setProducts(
          products.map(p =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  ...values,
                  updatedAt: new Date().toISOString().split('T')[0],
                }
              : p,
          ),
        );
        message.success('商品更新成功');
      } else {
        // 添加新商品
        const newProduct: Product = {
          id: Date.now().toString(),
          ...values,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        setProducts([...products, newProduct]);
        message.success('商品添加成功');
      }

      setModalVisible(false);
      form.resetFields();
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的商品');
      return;
    }

    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个商品吗？`,
      onOk() {
        setProducts(products.filter(p => !selectedRowKeys.includes(p.id)));
        setSelectedRowKeys([]);
        message.success('批量删除成功');
      },
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  // 过滤商品数据
  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchText.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2}>
          <ShoppingCartOutlined className="mr-2" />
          商品管理
        </Title>
        <Text type="secondary">管理店铺商品信息、库存和价格</Text>
      </div>

      {/* 操作栏 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索商品名称、SKU或品牌"
              allowClear
              onSearch={setSearchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>

          <Col xs={24} sm={12} md={16}>
            <div className="flex justify-end">
              <Space>
                <Button icon={<FilterOutlined />}>筛选</Button>
                <Button icon={<ExportOutlined />}>导出</Button>
                <Button icon={<ImportOutlined />}>导入</Button>

                {selectedRowKeys.length > 0 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBatchDelete}
                  >
                    批量删除 ({selectedRowKeys.length})
                  </Button>
                )}

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  添加商品
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 商品表格 */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加/编辑商品模态框 */}
      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            status: 'draft',
            featured: false,
            images: [],
          }}
        >
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                label="商品图片"
                name="images"
                rules={[{ required: true, message: '请上传商品图片' }]}
              >
                <ImageUpload
                  maxCount={5}
                  type="product"
                  generateThumbnail={true}
                  maxWidth={1200}
                  maxHeight={1200}
                  quality={85}
                  listType="picture-card"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="商品名称"
                name="name"
                rules={[{ required: true, message: '请输入商品名称' }]}
              >
                <Input placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="商品SKU"
                name="sku"
                rules={[{ required: true, message: '请输入商品SKU' }]}
              >
                <Input placeholder="请输入商品SKU" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="销售价格"
                name="price"
                rules={[{ required: true, message: '请输入销售价格' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  addonBefore="$"
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="原价" name="originalPrice">
                <InputNumber
                  min={0}
                  precision={2}
                  addonBefore="$"
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="库存数量"
                name="stock"
                rules={[{ required: true, message: '请输入库存数量' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="商品分类"
                name="category"
                rules={[{ required: true, message: '请选择商品分类' }]}
              >
                <Select placeholder="请选择商品分类">
                  <Option value="手机数码">手机数码</Option>
                  <Option value="电脑办公">电脑办公</Option>
                  <Option value="音频设备">音频设备</Option>
                  <Option value="家用电器">家用电器</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="品牌"
                name="brand"
                rules={[{ required: true, message: '请输入品牌' }]}
              >
                <Input placeholder="请输入品牌" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="draft">草稿</Option>
                  <Option value="published">已发布</Option>
                  <Option value="inactive">已下架</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="特色商品"
                name="featured"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="商品描述" name="description">
            <Input.TextArea rows={4} placeholder="请输入商品描述" />
          </Form.Item>

          <Divider />

          <div className="flex justify-end space-x-4">
            <Button onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingProduct ? '更新' : '创建'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
