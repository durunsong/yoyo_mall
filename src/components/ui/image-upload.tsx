/**
 * 图片上传组件 - shadcn/ui版本
 * 支持多种云存储服务的图片上传
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface UploadedImage {
  url: string;
  key: string;
  thumbnailUrl?: string;
  originalName: string;
}

interface ImageUploadProps {
  value?: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  maxCount?: number;
  type?: 'product' | 'avatar' | 'general';
  generateThumbnail?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  listType?: 'picture-card' | 'picture';
  className?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  maxCount = 1,
  type = 'general',
  generateThumbnail = false,
  maxWidth = 800,
  maxHeight = 600,
  quality = 80,
  listType = 'picture-card',
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (value.length + files.length > maxCount) {
      toast.error(`最多只能上传 ${maxCount} 张图片`);
      return;
    }

    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('generateThumbnail', generateThumbnail.toString());
        formData.append('maxWidth', maxWidth.toString());
        formData.append('maxHeight', maxHeight.toString());
        formData.append('quality', quality.toString());

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        const result = await response.json();
        return {
          url: result.url,
          key: result.key,
          thumbnailUrl: result.thumbnailUrl,
          originalName: file.name,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...value, ...uploadedImages];
      onChange?.(newImages);
      
      toast.success(`成功上传 ${uploadedImages.length} 张图片`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  }, [value, onChange, maxCount, type, generateThumbnail, maxWidth, maxHeight, quality]);

  const handleRemove = useCallback((index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange?.(newImages);
  }, [value, onChange]);

  const canUpload = value.length < maxCount;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 已上传的图片 */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {value.map((image, index) => (
            <Card key={image.key} className="relative overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square">
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.originalName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      {canUpload && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <input
              type="file"
              accept="image/*"
              multiple={maxCount > 1}
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />
            <label
              htmlFor="image-upload"
              className="flex cursor-pointer flex-col items-center justify-center space-y-2"
            >
              {uploading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-600">上传中...</span>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">点击上传图片</p>
                    <p className="text-xs text-gray-500">
                      支持 JPG、PNG 格式，最多 {maxCount} 张
                    </p>
                  </div>
                </>
              )}
            </label>
          </CardContent>
        </Card>
      )}
    </div>
  );
}