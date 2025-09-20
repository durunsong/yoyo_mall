'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useStaticTranslations } from '@/hooks/use-i18n';

interface AvatarUploadProps {
  onUploadSuccess: (avatarUrl: string) => void;
}

export function AvatarUpload({ onUploadSuccess }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t: tAccount } = useStaticTranslations('account');

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    setIsUploading(true);

    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append('file', file);

      // 上传到服务器
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        const tsUrl = `${data.url}${data.url.includes('?') ? '&' : '?'}v=${Date.now()}`;
        onUploadSuccess(tsUrl);
      } else {
        throw new Error(data.message || '上传失败');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      toast.error(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setIsUploading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleFileSelect}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {isUploading ? tAccount('buttons.saving') : tAccount('buttons.changeAvatar')}
      </Button>
    </>
  );
}
