/**
 * 头像上传组件 - shadcn/ui版本
 * 专门用于头像上传的组件
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface AvatarUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

export function AvatarUpload({
  value,
  onChange,
  size = 'md',
  className = ''
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { t: tAccount } = useStaticTranslations('account');

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');
      formData.append('generateThumbnail', 'true');
      formData.append('maxWidth', '200');
      formData.append('maxHeight', '200');
      formData.append('quality', '90');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();
      onChange?.(result.url);
      
      toast.success('头像上传成功');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('头像上传失败，请重试');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <Avatar className={sizeMap[size]}>
          <AvatarImage src={value} alt="头像" />
          <AvatarFallback>
            <User className="h-1/2 w-1/2" />
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          </div>
        )}
      </div>

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="avatar-upload"
          disabled={uploading}
        />
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={uploading}
        >
          <label htmlFor="avatar-upload" className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? tAccount('buttons.saving') : tAccount('buttons.changeAvatar')}
          </label>
        </Button>
      </div>
    </div>
  );
}