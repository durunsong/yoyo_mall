/**
 * 通用文件上传API接口
 * 重定向到实际的图片上传接口，兼容旧版调用
 * 支持上传到阿里云OSS
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
    products: OSS_FOLDERS.PRODUCTS,
    avatar: OSS_FOLDERS.AVATARS,
    avatars: OSS_FOLDERS.AVATARS,
    brand: OSS_FOLDERS.BRANDS,
    brands: OSS_FOLDERS.BRANDS,
    category: OSS_FOLDERS.CATEGORIES,
    categories: OSS_FOLDERS.CATEGORIES,
    banner: OSS_FOLDERS.BANNERS,
    banners: OSS_FOLDERS.BANNERS,
    document: OSS_FOLDERS.DOCUMENTS,
    documents: OSS_FOLDERS.DOCUMENTS,
    temp: OSS_FOLDERS.TEMP,
  };

  return folderMap[type] || OSS_FOLDERS.PRODUCTS; // 默认上传到商品文件夹
}

/**
 * POST方法 - 处理文件上传
 * 支持单文件和多文件上传
 * 自动上传到阿里云OSS
 */
export async function POST(request: NextRequest) {
  try {
    console.log('收到上传请求');

    // 解析表单数据
    const formData = await request.formData();
    
    // 兼容不同的字段名称
    let files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      files = formData.getAll('file') as File[];
    }
    if (!files || files.length === 0) {
      files = formData.getAll('image') as File[];
    }

    const type = (formData.get('type') as string) || 'products'; // 默认为商品类型
    const folder = (formData.get('folder') as string) || type;
    const generateThumbnail = formData.get('generateThumbnail') === 'true';
    const maxWidth = parseInt(formData.get('maxWidth') as string) || 1920;
    const maxHeight = parseInt(formData.get('maxHeight') as string) || 1080;
    const quality = parseInt(formData.get('quality') as string) || 85;

    console.log('上传参数:', {
      filesCount: files.length,
      type,
      folder,
      generateThumbnail,
    });

    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: '请选择要上传的文件',
          message: '没有找到文件' 
        },
        { status: 400 },
      );
    }

    const uploadResults: UploadResult[] = [];
    const errors: string[] = [];

    // 处理每个文件
    for (const file of files) {
      try {
        console.log(`开始上传文件: ${file.name}, 大小: ${file.size}, 类型: ${file.type}`);

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

        // 上传文件到阿里云OSS
        const result = await uploadFile({
          file: buffer,
          originalName: file.name,
          mimeType: file.type,
          folder: getUploadFolder(folder),
          generateThumbnail,
          maxWidth,
          maxHeight,
          quality,
        });

        console.log(`文件上传成功: ${file.name}, URL: ${result.url}`);
        uploadResults.push(result);
      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error);
        errors.push(
          `文件 ${file.name}: ${error instanceof Error ? error.message : '上传失败'}`,
        );
      }
    }

    // 返回结果
    const response: {
      success: boolean;
      data?: UploadResult[];
      urls?: string[]; // 兼容旧版返回格式
      errors?: string[];
      message: string;
    } = {
      success: uploadResults.length > 0,
      data: uploadResults,
      urls: uploadResults.map(r => r.url), // 兼容旧版格式
      message:
        uploadResults.length > 0
          ? `成功上传 ${uploadResults.length} 个文件到阿里云OSS`
          : '没有文件上传成功',
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    console.log('上传完成:', {
      成功数量: uploadResults.length,
      错误数量: errors.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('图片上传API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 },
    );
  }
}

/**
 * GET方法 - 返回API信息
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: '通用文件上传API - 上传到阿里云OSS',
    supportedMethods: ['POST'],
    supportedTypes: ALLOWED_IMAGE_TYPES,
    maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
    folders: OSS_FOLDERS,
    endpoint: '/api/upload',
    description: '支持单文件和多文件上传，自动上传到阿里云OSS',
  });
}

