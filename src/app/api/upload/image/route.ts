/**
 * 图片上传API接口
 * 支持单文件和多文件上传，自动优化和生成缩略图
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, OSS_FOLDERS, type UploadResult } from '@/lib/oss';

// 支持的图片格式
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
];

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 验证文件类型
function validateImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase());
}

// 验证文件大小
function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

// 获取文件夹路径
function getUploadFolder(type: string): string {
  const folderMap: Record<string, string> = {
    product: OSS_FOLDERS.PRODUCTS,
    avatar: OSS_FOLDERS.AVATARS,
    brand: OSS_FOLDERS.BRANDS,
    category: OSS_FOLDERS.CATEGORIES,
    banner: OSS_FOLDERS.BANNERS,
    document: OSS_FOLDERS.DOCUMENTS,
    temp: OSS_FOLDERS.TEMP,
  };
  
  return folderMap[type] || OSS_FOLDERS.TEMP;
}

export async function POST(request: NextRequest) {
  try {
    // 解析表单数据
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as string || 'temp';
    const generateThumbnail = formData.get('generateThumbnail') === 'true';
    const maxWidth = parseInt(formData.get('maxWidth') as string) || 1920;
    const maxHeight = parseInt(formData.get('maxHeight') as string) || 1080;
    const quality = parseInt(formData.get('quality') as string) || 85;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    const uploadResults: UploadResult[] = [];
    const errors: string[] = [];

    // 处理每个文件
    for (const file of files) {
      try {
        // 验证文件类型
        if (!validateImageType(file.type)) {
          errors.push(`文件 ${file.name}: 不支持的图片格式`);
          continue;
        }

        // 验证文件大小
        if (!validateFileSize(file.size)) {
          errors.push(`文件 ${file.name}: 文件大小超过限制 (最大 10MB)`);
          continue;
        }

        // 转换为Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 上传文件
        const result = await uploadFile({
          file: buffer,
          originalName: file.name,
          mimeType: file.type,
          folder: getUploadFolder(type),
          generateThumbnail,
          maxWidth,
          maxHeight,
          quality,
        });

        uploadResults.push(result);
      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error);
        errors.push(`文件 ${file.name}: ${error instanceof Error ? error.message : '上传失败'}`);
      }
    }

    // 返回结果
    const response: {
      success: boolean;
      data: UploadResult[];
      errors?: string[];
      message: string;
    } = {
      success: uploadResults.length > 0,
      data: uploadResults,
      message: uploadResults.length > 0 
        ? `成功上传 ${uploadResults.length} 个文件` 
        : '没有文件上传成功',
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('图片上传API错误:', error);
    return NextResponse.json(
      { 
        error: '服务器错误',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 支持的HTTP方法
export async function GET() {
  return NextResponse.json({
    message: '图片上传API',
    supportedMethods: ['POST'],
    supportedTypes: ALLOWED_IMAGE_TYPES,
    maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
    folders: OSS_FOLDERS,
  });
}
