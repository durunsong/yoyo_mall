/**
 * 头像上传组件
 * 专门用于用户头像上传，支持圆形裁剪预览
 */

'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  Avatar, 
  Button, 
  message, 
  Space,
  Modal,
  Typography
} from 'antd';
import {
  UploadOutlined,
  UserOutlined,
  LoadingOutlined,
  CameraOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface AvatarUploadProps {
  value?: string; // 当前头像URL
  onChange?: (url: string) => void;
  size?: number;
  maxSize?: number; // MB
  disabled?: boolean;
  shape?: 'circle' | 'square';
}

export function AvatarUpload({
  value,
  onChange,
  size = 100,
  maxSize = 2,
  disabled = false,
  shape = 'circle',
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // 上传前验证
  const beforeUpload = (file: File) => {
    // 检查文件类型
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG/WebP 格式的图片!');
      return false;
    }

    // 检查文件大小
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`图片大小不能超过 ${maxSize}MB!`);
      return false;
    }

    return true;
  };

  // 自定义上传函数
  const customUpload = async ({ file }: any) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('type', 'avatar');
    formData.append('generateThumbnail', 'true');
    formData.append('maxWidth', '300');
    formData.append('maxHeight', '300');
    formData.append('quality', '90');

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
        const uploadedFile = result.data[0];
        onChange?.(uploadedFile.thumbnailUrl || uploadedFile.url);
        message.success('头像上传成功!');
      } else {
        throw new Error(result.errors?.[0] || '上传失败');
      }
    } catch (error) {
      console.error('上传错误:', error);
      message.error('头像上传失败!');
    } finally {
      setUploading(false);
    }
  };

  // 预览头像
  const handlePreview = () => {
    if (value) {
      setPreviewVisible(true);
    }
  };

  return (
    <div className="avatar-upload">
      <Space direction="vertical" align="center">
        {/* 头像显示区域 */}
        <div 
          className="avatar-wrapper"
          style={{ 
            position: 'relative',
            cursor: value ? 'pointer' : 'default'
          }}
          onClick={handlePreview}
        >
          <Avatar
            size={size}
            src={value}
            icon={!value && <UserOutlined />}
            shape={shape}
            style={{
              backgroundColor: !value ? '#f56a00' : undefined,
              border: '2px solid #d9d9d9',
            }}
          />
          
          {/* 悬浮的相机图标 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: '#1890ff',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px solid white',
            }}
          >
            <CameraOutlined style={{ color: 'white', fontSize: 12 }} />
          </div>
        </div>

        {/* 上传按钮 */}
        <Upload
          accept="image/*"
          beforeUpload={beforeUpload}
          customRequest={customUpload}
          disabled={disabled || uploading}
          showUploadList={false}
        >
          <Button
            icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
            loading={uploading}
            disabled={disabled}
            size="small"
          >
            {value ? '更换头像' : '上传头像'}
          </Button>
        </Upload>

        {/* 提示文字 */}
        <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
          支持 JPG、PNG、WebP 格式<br />
          文件大小不超过 {maxSize}MB
        </Text>
      </Space>

      {/* 预览模态框 */}
      <Modal
        open={previewVisible}
        title="头像预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Avatar
            size={200}
            src={value}
            shape={shape}
          />
        </div>
      </Modal>

      <style jsx>{`
        .avatar-upload {
          display: inline-block;
        }
        
        .avatar-wrapper:hover .ant-avatar {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}

export default AvatarUpload;
