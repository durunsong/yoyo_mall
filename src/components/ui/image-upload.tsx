/**
 * 图片上传组件
 * 支持拖拽上传、预览、进度显示、多文件上传等功能
 */

'use client';

import React, { useState } from 'react';
import {
  Upload,
  Button,
  Card,
  Image,
  Progress,
  Space,
  Typography,
  Row,
  Col,
  message,
  Modal,
  Tag,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  LoadingOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
const { Text } = Typography;
const { Dragger } = Upload;

// 上传结果类型
interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  size: number;
  mimeType: string;
  originalName: string;
}

// 组件属性
interface ImageUploadProps {
  value?: UploadResult[];
  onChange?: (files: UploadResult[]) => void;
  maxCount?: number;
  maxSize?: number; // MB
  type?: string; // 上传类型
  generateThumbnail?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  disabled?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  listType?: 'text' | 'picture' | 'picture-card' | 'picture-circle';
  accept?: string;
  className?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  maxCount = 1,
  maxSize = 10,
  type = 'temp',
  generateThumbnail = true,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 85,
  disabled = false,
  showPreview = true,
  showProgress = true,
  listType = 'picture-card',
  accept = 'image/*',
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  // const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
  //   {},
  // ); // 暂时未使用
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // 上传前验证
  const beforeUpload = (file: File) => {
    // 检查文件类型
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return false;
    }

    // 检查文件大小
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`图片大小不能超过 ${maxSize}MB!`);
      return false;
    }

    // 检查数量限制
    if (value.length >= maxCount) {
      message.error(`最多只能上传 ${maxCount} 张图片!`);
      return false;
    }

    return true;
  };

  // 自定义上传函数
  const customUpload = async ({
    file,
    onProgress,
    onSuccess,
    onError,
  }: any) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('type', type);
    formData.append('generateThumbnail', generateThumbnail.toString());
    formData.append('maxWidth', maxWidth.toString());
    formData.append('maxHeight', maxHeight.toString());
    formData.append('quality', quality.toString());

    try {
      setUploading(true);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();

      if (result.success && result.data.length > 0) {
        const newFiles = [...value, ...result.data];
        onChange?.(newFiles);
        onSuccess?.(result.data[0]);
        message.success('上传成功!');
      } else {
        throw new Error(result.errors?.[0] || '上传失败');
      }
    } catch (error) {
      console.error('上传错误:', error);
      onError?.(error);
      message.error('上传失败!');
    } finally {
      setUploading(false);
    }
  };

  // 删除文件
  const handleRemove = async (file: UploadResult) => {
    try {
      // 调用删除API
      const response = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keys: [file.key, file.thumbnailKey].filter(Boolean),
        }),
      });

      if (response.ok) {
        const newFiles = value.filter(f => f.key !== file.key);
        onChange?.(newFiles);
        message.success('删除成功!');
      } else {
        message.error('删除失败!');
      }
    } catch (error) {
      console.error('删除错误:', error);
      message.error('删除失败!');
    }
  };

  // 预览图片
  const handlePreview = (file: UploadResult) => {
    setPreviewImage(file.url);
    setPreviewTitle(file.originalName);
    setPreviewVisible(true);
  };

  // 取消预览
  const handleCancelPreview = () => {
    setPreviewVisible(false);
    setPreviewImage('');
    setPreviewTitle('');
  };

  // 渲染上传按钮
  const renderUploadButton = () => {
    if (listType === 'picture-card') {
      return (
        <div className="upload-button">
          {uploading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>上传图片</div>
        </div>
      );
    }

    return (
      <Button icon={<UploadOutlined />} loading={uploading}>
        选择图片
      </Button>
    );
  };

  // 渲染文件列表
  const renderFileList = () => {
    if (listType === 'picture-card') {
      return (
        <Row gutter={[16, 16]}>
          {value.map((file, index) => (
            <Col key={file.key}>
              <Card
                size="small"
                cover={
                  <div className="relative">
                    <Image
                      src={file.thumbnailUrl || file.url}
                      alt={file.originalName}
                      width={104}
                      height={104}
                      style={{ objectFit: 'cover' }}
                      preview={false}
                    />
                  </div>
                }
                actions={[
                  showPreview && (
                    <EyeOutlined
                      key="preview"
                      onClick={() => handlePreview(file)}
                    />
                  ),
                  <DeleteOutlined
                    key="delete"
                    onClick={() => handleRemove(file)}
                  />,
                ].filter(Boolean)}
                className="upload-card"
              >
                <Card.Meta
                  title={
                    <Text ellipsis style={{ width: 80 }}>
                      {file.originalName}
                    </Text>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </Text>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      );
    }

    return (
      <Space direction="vertical" className="w-full">
        {value.map(file => (
          <Card key={file.key} size="small">
            <Space>
              <FileImageOutlined />
              <Text>{file.originalName}</Text>
              <Tag color="blue">{(file.size / 1024).toFixed(1)} KB</Tag>
              <Space>
                {showPreview && (
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(file)}
                  />
                )}
                <Button
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(file)}
                  danger
                />
              </Space>
            </Space>
          </Card>
        ))}
      </Space>
    );
  };

  return (
    <div className={`image-upload ${className || ''}`}>
      {/* 上传区域 */}
      {value.length < maxCount && (
        <Dragger
          accept={accept}
          beforeUpload={beforeUpload}
          customRequest={customUpload}
          disabled={disabled || uploading}
          showUploadList={false}
          className="mb-4"
        >
          <p className="ant-upload-drag-icon">
            <FileImageOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个或批量上传，最多 {maxCount} 张，大小不超过 {maxSize}MB
          </p>
        </Dragger>
      )}

      {/* 进度条 */}
      {uploading && showProgress && (
        <Progress
          percent={50}
          status="active"
          showInfo={false}
          className="mb-4"
        />
      )}

      {/* 文件列表 */}
      {value.length > 0 && renderFileList()}

      {/* 预览模态框 */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handleCancelPreview}
        width={800}
        centered
      >
        <Image alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>

      <style jsx>{`
        .upload-button {
          text-align: center;
          padding: 16px;
          border: 1px dashed #d9d9d9;
          border-radius: 6px;
          cursor: pointer;
          transition: border-color 0.3s;
        }

        .upload-button:hover {
          border-color: #1890ff;
        }

        .upload-card {
          width: 120px;
        }

        .upload-card .ant-card-cover {
          padding: 8px;
        }

        .upload-card .ant-card-body {
          padding: 8px;
        }
      `}</style>
    </div>
  );
}

export default ImageUpload;
