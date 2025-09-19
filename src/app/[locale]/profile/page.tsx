/**
 * 电商个人中心页面
 * 包含用户信息管理、订单历史、收货地址、安全设置等功能
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  Avatar,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Tabs,
  Table,
  Tag,
  Badge,
  Row,
  Col,
  Space,
  Divider,
  List,
  Rate,
  Progress,
  Statistic,
  message,
  Modal,
  Switch,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  CameraOutlined,
  ShoppingOutlined,
  HeartOutlined,
  GiftOutlined,
  CreditCardOutlined,
  SecurityScanOutlined,
  BellOutlined,
  EnvironmentOutlined,
  StarOutlined,
  TrophyOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { UploadProps, TabsProps } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

// 模拟用户数据
const mockUserData = {
  id: 'user123',
  username: 'admin',
  email: 'admin@163.com',
  phone: '19985562444',
  avatar: '/images/default-avatar.png',
  fullName: '李明',
  gender: 'male',
  birthday: '1990-05-15',
  memberLevel: 'Gold',
  memberPoints: 2580,
  totalOrders: 45,
  totalSpent: 12580.0,
  joinDate: '2023-08-12',
  bio: '热爱购物的用户',
  company: 'YOYO科技有限公司',
};

// 模拟订单数据
const mockOrders = [
  {
    id: 'ORD001',
    date: '2024-01-15',
    status: 'delivered',
    total: 299.99,
    items: 3,
    products: ['iPhone 数据线', 'AirPods Pro', '手机壳'],
  },
  {
    id: 'ORD002',
    date: '2024-01-10',
    status: 'shipping',
    total: 159.99,
    items: 2,
    products: ['蓝牙耳机', '充电宝'],
  },
  {
    id: 'ORD003',
    date: '2024-01-05',
    status: 'processing',
    total: 89.99,
    items: 1,
    products: ['无线鼠标'],
  },
];

// 模拟收货地址数据
const mockAddresses = [
  {
    id: 'addr1',
    name: '李明',
    phone: '13888888888',
    address: '北京市朝阳区建国门外大街1号',
    postcode: '100022',
    isDefault: true,
  },
  {
    id: 'addr2',
    name: '李明',
    phone: '13999999999',
    address: '上海市浦东新区陆家嘴环路1000号',
    postcode: '200120',
    isDefault: false,
  },
];

export default function ProfilePage() {
  const t = useTranslations('profile');
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  // 处理头像上传
  const handleAvatarUpload: UploadProps['onChange'] = info => {
    if (info.file.status === 'done') {
      message.success('头像上传成功');
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };

  // 处理信息保存
  const handleSaveProfile = async (values: any) => {
    try {
      // 这里应该调用API保存用户信息
      console.log('保存用户信息:', values);
      message.success('个人信息保存成功');
      setIsEditing(false);
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  // 订单状态标签
  const getOrderStatusTag = (status: string) => {
    const statusMap = {
      delivered: { color: 'green', text: '已送达' },
      shipping: { color: 'blue', text: '配送中' },
      processing: { color: 'orange', text: '处理中' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // 会员等级颜色
  const getMemberLevelColor = (level: string) => {
    const levelMap = {
      Bronze: '#CD7F32',
      Silver: '#C0C0C0',
      Gold: '#FFD700',
      Platinum: '#E5E4E2',
      Diamond: '#B9F2FF',
    };
    return levelMap[level as keyof typeof levelMap] || '#1890ff';
  };

  // 订单表格列配置
  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '订单日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '商品',
      dataIndex: 'products',
      key: 'products',
      render: (products: string[]) => products.join(', '),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getOrderStatusTag(status),
    },
    {
      title: '金额',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `¥${total.toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" size="small">
            查看详情
          </Button>
          <Button type="link" size="small">
            再次购买
          </Button>
        </Space>
      ),
    },
  ];

  // 标签页配置
  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: (
        <span>
          <UserOutlined />
          账户概览
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* 左侧：用户信息卡片 */}
          <Col xs={24} lg={8}>
            <Card
              title="个人资料"
              extra={
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => setIsEditing(true)}
                >
                  编辑
                </Button>
              }
            >
              <div className="mb-6 text-center">
                <div className="relative inline-block">
                  <Avatar
                    size={100}
                    src={mockUserData.avatar}
                    icon={<UserOutlined />}
                  />
                  <Upload
                    showUploadList={false}
                    onChange={handleAvatarUpload}
                    className="absolute right-0 bottom-0"
                  >
                    <Button
                      type="primary"
                      size="small"
                      shape="circle"
                      icon={<CameraOutlined />}
                      className="shadow-lg"
                    />
                  </Upload>
                </div>
                <h3 className="mt-4 mb-2 text-lg font-semibold">
                  {mockUserData.fullName}
                </h3>
                <Badge
                  count={mockUserData.memberLevel}
                  style={{
                    backgroundColor: getMemberLevelColor(
                      mockUserData.memberLevel,
                    ),
                  }}
                />
              </div>

              <Space direction="vertical" className="w-full">
                <div className="flex justify-between">
                  <span className="text-gray-600">用户名:</span>
                  <span>{mockUserData.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">邮箱:</span>
                  <span>{mockUserData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">手机:</span>
                  <span>{mockUserData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">注册时间:</span>
                  <span>{mockUserData.joinDate}</span>
                </div>
              </Space>
            </Card>

            {/* 会员权益卡片 */}
            <Card title="会员权益" className="mt-4">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span>积分余额</span>
                  <span className="text-lg font-semibold text-orange-500">
                    {mockUserData.memberPoints.toLocaleString()}
                  </span>
                </div>
                <Progress
                  percent={65}
                  strokeColor="#ff7a00"
                  format={() => '升级至白金会员还需 920 积分'}
                />
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="总订单数"
                    value={mockUserData.totalOrders}
                    prefix={<ShoppingOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="总消费"
                    value={mockUserData.totalSpent}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 右侧：快速功能区 */}
          <Col xs={24} lg={16}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card hoverable className="text-center">
                  <ShoppingOutlined className="mb-2 text-2xl text-blue-500" />
                  <div className="text-sm">我的订单</div>
                  <div className="text-xs text-gray-500">管理订单</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card hoverable className="text-center">
                  <HeartOutlined className="mb-2 text-2xl text-red-500" />
                  <div className="text-sm">我的收藏</div>
                  <div className="text-xs text-gray-500">收藏商品</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card hoverable className="text-center">
                  <GiftOutlined className="mb-2 text-2xl text-purple-500" />
                  <div className="text-sm">优惠券</div>
                  <div className="text-xs text-gray-500">我的优惠券</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card hoverable className="text-center">
                  <WalletOutlined className="mb-2 text-2xl text-green-500" />
                  <div className="text-sm">余额</div>
                  <div className="text-xs text-gray-500">账户余额</div>
                </Card>
              </Col>
            </Row>

            {/* 最近订单 */}
            <Card
              title="最近订单"
              className="mt-6"
              extra={<Button type="link">查看全部</Button>}
            >
              <List
                dataSource={mockOrders.slice(0, 3)}
                renderItem={order => (
                  <List.Item
                    actions={[
                      <Button type="link" key="view">
                        查看详情
                      </Button>,
                      <Button type="link" key="rebuy">
                        再次购买
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>订单号: {order.id}</span>
                          {getOrderStatusTag(order.status)}
                        </Space>
                      }
                      description={
                        <div>
                          <div>商品: {order.products.join(', ')}</div>
                          <div className="mt-1 flex justify-between">
                            <span>{order.date}</span>
                            <span className="font-semibold">
                              ¥{order.total}
                            </span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'orders',
      label: (
        <span>
          <ShoppingOutlined />
          我的订单
        </span>
      ),
      children: (
        <Card>
          <Table
            dataSource={mockOrders}
            columns={orderColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      ),
    },
    {
      key: 'addresses',
      label: (
        <span>
          <EnvironmentOutlined />
          收货地址
        </span>
      ),
      children: (
        <div>
          <div className="mb-4">
            <Button type="primary" icon={<EnvironmentOutlined />}>
              添加新地址
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {mockAddresses.map(addr => (
              <Col xs={24} md={12} key={addr.id}>
                <Card
                  actions={[
                    <Button type="link" key="edit">
                      编辑
                    </Button>,
                    <Button type="link" danger key="delete">
                      删除
                    </Button>,
                  ]}
                >
                  {addr.isDefault && (
                    <Tag color="gold" className="mb-2">
                      默认地址
                    </Tag>
                  )}
                  <div className="space-y-2">
                    <div>
                      <strong>{addr.name}</strong> {addr.phone}
                    </div>
                    <div>{addr.address}</div>
                    <div>邮编: {addr.postcode}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined />
          安全设置
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="账户安全">
              <Space direction="vertical" className="w-full" size="large">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">登录密码</div>
                    <div className="text-sm text-gray-500">
                      定期更改密码以保护账户安全
                    </div>
                  </div>
                  <Button type="link">修改</Button>
                </div>
                <Divider />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">手机号码</div>
                    <div className="text-sm text-gray-500">
                      {mockUserData.phone}
                    </div>
                  </div>
                  <Button type="link">更换</Button>
                </div>
                <Divider />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">邮箱地址</div>
                    <div className="text-sm text-gray-500">
                      {mockUserData.email}
                    </div>
                  </div>
                  <Button type="link">更换</Button>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="隐私设置">
              <Space direction="vertical" className="w-full" size="large">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">接收推广信息</div>
                    <div className="text-sm text-gray-500">
                      通过邮件和短信接收优惠信息
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Divider />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">订单状态通知</div>
                    <div className="text-sm text-gray-500">
                      接收订单状态变更通知
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Divider />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">个性化推荐</div>
                    <div className="text-sm text-gray-500">
                      根据购买历史推荐商品
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        <p className="mt-1 text-gray-600">管理您的个人信息和账户设置</p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        tabPosition="top"
        size="large"
      />

      {/* 编辑个人信息模态框 */}
      <Modal
        title="编辑个人信息"
        open={isEditing}
        onCancel={() => setIsEditing(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={mockUserData}
          onFinish={handleSaveProfile}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="fullName"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="性别" name="gender">
                <Select>
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="手机号"
                name="phone"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[{ required: true, type: 'email' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="公司" name="company">
            <Input />
          </Form.Item>
          <Form.Item label="个人简介" name="bio">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setIsEditing(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
