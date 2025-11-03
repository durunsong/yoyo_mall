/**
 * 图片上传组件
 * 支持单张或多张图片上传
 */

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const OSS_BASE_URL = process.env.NEXT_PUBLIC_OSS_BASE_URL || process.env.BASE_OSS_URL;
const OSS_FOLDER = process.env.OSS_FOLDER && process.env.OSS_FOLDER !== 'root' ? process.env.OSS_FOLDER : undefined;
const PLACEHOLDER_IMAGE = OSS_BASE_URL
  ? `${OSS_BASE_URL.replace(/\/+$/u, '')}/${OSS_FOLDER ? `${OSS_FOLDER.replace(/\/+$/gu, '')}/` : ''}placeholder.png`
  : 'https://next-static-oss.oss-rg-china-mainland.aliyuncs.com/placeholder.png';

const resolveImageUrl = (src?: string | null) => {
  if (!src) {
    return PLACEHOLDER_IMAGE;
  }

  try {
    const url = new URL(src);
    if (url.hostname.endsWith('aliyuncs.com')) {
      return url.toString();
    }
    if (OSS_BASE_URL && src.startsWith(OSS_BASE_URL)) {
      return src;
    }
  } catch (error) {
    // ignore
  }

  return PLACEHOLDER_IMAGE;
};

interface ImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 检查文件数量限制
    if (value.length + files.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 张图片`);
      return;
    }

    // 检查文件类型和大小
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} 不是图片文件`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 超过 5MB 限制`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      setUploading(true);

      // 上传所有文件
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('folder', 'products');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || data.message || '上传失败');
        }

        // 兼容不同的响应格式
        const url = data.urls?.[0] || data.data?.[0]?.url || '';
        if (!url || !url.trim()) {
          throw new Error('未返回有效的图片URL');
        }
        return url;
      });

      const urls = await Promise.all(uploadPromises);
      // 过滤掉空字符串
      const validUrls = urls.filter(url => url && url.trim());
      onChange([...value, ...validUrls]);
      toast.success(`成功上传 ${validUrls.length} 张图片`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除图片
  const handleRemove = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const newValue = [...value];
    const [selectedImage] = newValue.splice(index, 1);
    newValue.unshift(selectedImage);
    onChange(newValue);
    toast.success('已设置为主图');
  };

  // 触发文件选择
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 图片预览网格 */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {value.filter(url => url && url.trim()).map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border overflow-hidden group bg-gray-50"
            >
              <Image
                src={resolveImageUrl(url)}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={(event) => {
                  const target = event.currentTarget as HTMLImageElement;
                  if (target.src !== PLACEHOLDER_IMAGE) {
                    target.src = PLACEHOLDER_IMAGE;
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled || uploading}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 hover:bg-red-600 shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(index)}
                  disabled={disabled || uploading}
                  className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  设为主图
                </button>
              )}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded shadow-md">
                  主图
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      {value.length < maxFiles && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={disabled || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                上传图片 ({value.length}/{maxFiles})
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            支持 JPG、PNG、GIF 格式,单个文件不超过 5MB
          </p>
        </div>
      )}

      {/* 空状态 */}
      {value.length === 0 && !uploading && (
        <div
          onClick={handleClick}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">点击或拖拽上传图片</p>
          <p className="text-xs text-gray-500 mt-1">
            最多 {maxFiles} 张,每张不超过 5MB
          </p>
        </div>
      )}
    </div>
  );
}



