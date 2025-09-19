/**
 * 图片上传功能演示页面
 * 展示不同类型的图片上传组件使用方法
 */

'use client';

import { useState } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Divider,
  Button,
  message
} from 'antd';
import { ImageUpload, AvatarUpload } from '@/components/ui';

const { Title, Paragraph, Text } = Typography;

interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export default function UploadDemoPage() {
  // 各种上传状态
  const [productImages, setProductImages] = useState<UploadResult[]>([]);
  const [brandLogo, setBrandLogo] = useState<UploadResult[]>([]);
  const [bannerImage, setBannerImage] = useState<UploadResult[]>([]);
  const [userAvatar, setUserAvatar] = useState<string>('');

  const handleClearAll = () => {
    setProductImages([]);
    setBrandLogo([]);
    setBannerImage([]);
    setUserAvatar('');
    message.success('已清空所有上传的图片');
  };

  const handleShowData = () => {
    console.log('当前上传数据:', {
      productImages,
      brandLogo,
      bannerImage,
      userAvatar,
    });
    message.info('数据已输出到控制台');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <Title level={2}>图片上传功能演示</Title>
        <Paragraph className="text-gray-600">
          演示各种图片上传场景的使用方法，基于阿里云OSS存储
        </Paragraph>
        
        <Space>
          <Button onClick={handleShowData}>查看数据</Button>
          <Button onClick={handleClearAll} danger>清空所有</Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* 商品图片上传 */}
        <Col xs={24} lg={12}>
          <Card title="商品图片上传" className="h-full">
            <Space direction="vertical" className="w-full">
              <Text type="secondary">
                支持多张图片上传，自动生成缩略图，适用于商品展示
              </Text>
              
              <ImageUpload
                value={productImages}
                onChange={setProductImages}
                maxCount={5}
                type="product"
                generateThumbnail={true}
                maxWidth={1200}
                maxHeight={1200}
                quality={85}
                listType="picture-card"
              />

              <div className="bg-gray-50 p-3 rounded">
                <Text strong>配置参数：</Text>
                <ul className="text-sm text-gray-600 mt-2">
                  <li>最大数量：5张</li>
                  <li>存储路径：yoyo_mall/products/</li>
                  <li>生成缩略图：是</li>
                  <li>最大尺寸：1200x1200</li>
                  <li>压缩质量：85%</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 品牌Logo上传 */}
        <Col xs={24} lg={12}>
          <Card title="品牌Logo上传" className="h-full">
            <Space direction="vertical" className="w-full">
              <Text type="secondary">
                单张图片上传，高质量保存，适用于品牌Logo
              </Text>
              
              <ImageUpload
                value={brandLogo}
                onChange={setBrandLogo}
                maxCount={1}
                type="brand"
                generateThumbnail={false}
                maxWidth={800}
                maxHeight={800}
                quality={95}
                listType="picture-card"
              />

              <div className="bg-gray-50 p-3 rounded">
                <Text strong>配置参数：</Text>
                <ul className="text-sm text-gray-600 mt-2">
                  <li>最大数量：1张</li>
                  <li>存储路径：yoyo_mall/brands/</li>
                  <li>生成缩略图：否</li>
                  <li>最大尺寸：800x800</li>
                  <li>压缩质量：95%</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 轮播图上传 */}
        <Col xs={24} lg={12}>
          <Card title="轮播图上传">
            <Space direction="vertical" className="w-full">
              <Text type="secondary">
                大图上传，适用于首页轮播图等场景
              </Text>
              
              <ImageUpload
                value={bannerImage}
                onChange={setBannerImage}
                maxCount={1}
                maxSize={5}
                type="banner"
                generateThumbnail={true}
                maxWidth={1920}
                maxHeight={1080}
                quality={90}
                listType="text"
              />

              <div className="bg-gray-50 p-3 rounded">
                <Text strong>配置参数：</Text>
                <ul className="text-sm text-gray-600 mt-2">
                  <li>最大数量：1张</li>
                  <li>最大大小：5MB</li>
                  <li>存储路径：yoyo_mall/banners/</li>
                  <li>最大尺寸：1920x1080</li>
                  <li>压缩质量：90%</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 用户头像上传 */}
        <Col xs={24} lg={12}>
          <Card title="用户头像上传">
            <Space direction="vertical" className="w-full">
              <Text type="secondary">
                圆形头像上传，自动裁剪和优化
              </Text>
              
              <div className="text-center">
                <AvatarUpload
                  value={userAvatar}
                  onChange={setUserAvatar}
                  size={120}
                  maxSize={2}
                  shape="circle"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <Text strong>配置参数：</Text>
                <ul className="text-sm text-gray-600 mt-2">
                  <li>显示大小：120px</li>
                  <li>最大大小：2MB</li>
                  <li>存储路径：yoyo_mall/avatars/</li>
                  <li>输出尺寸：300x300</li>
                  <li>形状：圆形</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 技术说明 */}
      <Card title="技术说明">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Title level={4}>功能特性</Title>
            <ul className="space-y-2">
              <li>✅ 拖拽上传支持</li>
              <li>✅ 多文件批量上传</li>
              <li>✅ 图片自动压缩优化</li>
              <li>✅ 缩略图自动生成</li>
              <li>✅ 文件类型和大小验证</li>
              <li>✅ 上传进度显示</li>
              <li>✅ 图片预览功能</li>
              <li>✅ 文件删除管理</li>
            </ul>
          </Col>
          
          <Col xs={24} md={12}>
            <Title level={4}>存储结构</Title>
            <div className="bg-gray-50 p-4 rounded font-mono text-sm">
              <div>OSS Bucket: next-static-oss</div>
              <div>基础路径: yoyo_mall/</div>
              <div>├── products/     # 商品图片</div>
              <div>├── brands/       # 品牌Logo</div>
              <div>├── banners/      # 轮播图</div>
              <div>├── avatars/      # 用户头像</div>
              <div>├── categories/   # 分类图片</div>
              <div>└── temp/         # 临时文件</div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
