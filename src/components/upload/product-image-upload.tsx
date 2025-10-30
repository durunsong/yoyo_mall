/**
 * 商品图片上传组件
 * 使用阿里云 OSS 存储
 */

'use client';

import { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';

interface ProductImageUploadProps {
  value?: string[]; // 已上传的图片URL数组
  onChange: (urls: string[]) => void;
  maxImages?: number;
  folder?: string; // OSS文件夹
}

export function ProductImageUpload({
  value = [],
  onChange,
  maxImages = 10,
  folder = 'products',
}: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // 检查数量限制
    if (value.length + files.length > maxImages) {
      toast.error(`最多只能上传 ${maxImages} 张图片`);
      return;
    }

    // 验证文件
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} 不是图片文件`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 超过 5MB 大小限制`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      // 并发上传所有文件
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || '上传失败');
        }

        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      // 更新图片列表
      onChange([...value, ...uploadedUrls]);
      
      toast.success(`成功上传 ${uploadedUrls.length} 张图片`);
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
      // 清空input
      e.target.value = '';
    }
  };

  // 删除图片
  const handleRemove = async (url: string, index: number) => {
    try {
      // 调用删除 API
      await fetch('/api/upload/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      // 更新列表
      const newUrls = value.filter((_, i) => i !== index);
      onChange(newUrls);
      
      toast.success('图片删除成功');
    } catch (error) {
      console.error('删除图片失败:', error);
      toast.error('删除图片失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div className="flex items-center gap-4">
        <label
          htmlFor="product-image-upload"
          className={`flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-blue-500 hover:bg-blue-50 ${
            uploading ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">上传中...</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">点击上传</span>
              <span className="text-xs text-gray-400">
                {value.length}/{maxImages}
              </span>
            </>
          )}
        </label>
        <input
          id="product-image-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading || value.length >= maxImages}
        />
        
        <div className="flex-1 text-sm text-gray-600">
          <p>• 支持 JPG、PNG、GIF、WEBP 格式</p>
          <p>• 单张图片最大 5MB</p>
          <p>• 最多上传 {maxImages} 张图片</p>
          <p>• 图片将自动压缩优化</p>
        </div>
      </div>

      {/* 图片列表 */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border"
            >
              <Image
                src={url}
                alt={`Product ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-full items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemove(url, index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* 主图标识 */}
              {index === 0 && (
                <div className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-1 text-xs text-white">
                  主图
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {value.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
          <ImageIcon className="h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-600">还没有上传图片</p>
          <p className="text-xs text-gray-400">点击上方按钮开始上传</p>
        </div>
      )}
    </div>
  );
}



