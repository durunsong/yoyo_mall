/**
 * 阿里云OSS工具类
 * 处理文件上传、删除、获取等操作
 */

import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// OSS配置接口
interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  bucket: string;
  baseUrl: string;
  folder: string;
}

// 上传文件类型
export interface UploadFileOptions {
  file: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
  generateThumbnail?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

// 上传结果类型
export interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  size: number;
  mimeType: string;
  originalName: string;
}

// OSS配置
const ossConfig: OSSConfig = {
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  region: process.env.OSS_REGION!,
  bucket: process.env.OSS_BUCKET!,
  baseUrl: process.env.BASE_OSS_URL!,
  folder: process.env.OSS_FOLDER || 'yoyo_mall',
};

// 验证OSS配置
if (!ossConfig.accessKeyId || !ossConfig.accessKeySecret || !ossConfig.region || !ossConfig.bucket) {
  throw new Error('阿里云OSS配置不完整，请检查环境变量');
}

// 创建OSS客户端
let ossClient: OSS | null = null;

function getOSSClient(): OSS {
  if (!ossClient) {
    ossClient = new OSS({
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      region: ossConfig.region,
      bucket: ossConfig.bucket,
    });
  }
  return ossClient;
}

/**
 * 生成唯一文件名
 */
function generateFileName(originalName: string, folder?: string): string {
  const ext = originalName.split('.').pop() || '';
  const uuid = uuidv4();
  const timestamp = Date.now();
  const fileName = `${uuid}-${timestamp}.${ext}`;
  
  const basePath = folder ? `${ossConfig.folder}/${folder}` : ossConfig.folder;
  return `${basePath}/${fileName}`;
}

/**
 * 获取文件的完整URL
 */
function getFileUrl(key: string): string {
  return `${ossConfig.baseUrl}/${key}`;
}

/**
 * 图片压缩和优化
 */
async function optimizeImage(
  buffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'jpeg',
  } = options;

  let sharpInstance = sharp(buffer);

  // 获取图片信息
  const metadata = await sharpInstance.metadata();
  
  // 如果图片尺寸超过限制，进行缩放
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }

  // 转换格式和压缩
  if (format === 'jpeg') {
    sharpInstance = sharpInstance.jpeg({ quality });
  } else if (format === 'png') {
    sharpInstance = sharpInstance.png({ quality });
  } else if (format === 'webp') {
    sharpInstance = sharpInstance.webp({ quality });
  }

  return await sharpInstance.toBuffer();
}

/**
 * 生成缩略图
 */
async function generateThumbnail(
  buffer: Buffer,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<Buffer> {
  const { width = 300, height = 300, quality = 80 } = options;

  return await sharp(buffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality })
    .toBuffer();
}

/**
 * 上传文件到OSS
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadResult> {
  try {
    const client = getOSSClient();
    let { file, originalName, mimeType, folder, generateThumbnail: shouldGenerateThumbnail } = options;

    // 如果是图片，进行优化
    if (mimeType.startsWith('image/')) {
      file = await optimizeImage(file, {
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        quality: options.quality,
      });
    }

    // 生成文件名
    const key = generateFileName(originalName, folder);

    // 上传主文件
    const result = await client.put(key, file, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000', // 1年缓存
      },
    });

    const uploadResult: UploadResult = {
      url: getFileUrl(key),
      key,
      size: file.length,
      mimeType,
      originalName,
    };

    // 如果是图片且需要生成缩略图
    if (shouldGenerateThumbnail && mimeType.startsWith('image/')) {
      try {
        const thumbnailBuffer = await generateThumbnail(file);
        const thumbnailKey = generateFileName(`thumb_${originalName}`, folder);
        
        await client.put(thumbnailKey, thumbnailBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000',
          },
        });

        uploadResult.thumbnailUrl = getFileUrl(thumbnailKey);
        uploadResult.thumbnailKey = thumbnailKey;
      } catch (thumbnailError) {
        console.warn('生成缩略图失败:', thumbnailError);
        // 缩略图生成失败不影响主文件上传
      }
    }

    console.log('文件上传成功:', {
      key,
      url: uploadResult.url,
      size: uploadResult.size,
    });

    return uploadResult;
  } catch (error) {
    console.error('OSS文件上传失败:', error);
    throw new Error(`文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 删除OSS文件
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const client = getOSSClient();
    await client.delete(key);
    console.log('文件删除成功:', key);
    return true;
  } catch (error) {
    console.error('OSS文件删除失败:', error);
    throw new Error(`文件删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 批量删除OSS文件
 */
export async function deleteFiles(keys: string[]): Promise<void> {
  try {
    const client = getOSSClient();
    const result = await client.deleteMulti(keys);
    console.log('批量删除文件成功:', result);
  } catch (error) {
    console.error('OSS批量删除文件失败:', error);
    throw new Error(`批量删除文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 检查文件是否存在
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const client = getOSSClient();
    await client.head(key);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取文件信息
 */
export async function getFileInfo(key: string) {
  try {
    const client = getOSSClient();
    const result = await client.head(key);
    return {
      size: parseInt(result.res.headers['content-length'] || '0'),
      mimeType: result.res.headers['content-type'],
      lastModified: result.res.headers['last-modified'],
      etag: result.res.headers.etag,
    };
  } catch (error) {
    console.error('获取文件信息失败:', error);
    throw new Error(`获取文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 列出指定前缀的文件
 */
export async function listFiles(prefix: string = '', maxKeys: number = 100) {
  try {
    const client = getOSSClient();
    const result = await client.list({
      prefix: `${ossConfig.folder}/${prefix}`,
      'max-keys': maxKeys,
    });

    return result.objects?.map((obj) => ({
      key: obj.name,
      url: getFileUrl(obj.name!),
      size: obj.size,
      lastModified: obj.lastModified,
      etag: obj.etag,
    })) || [];
  } catch (error) {
    console.error('列出文件失败:', error);
    throw new Error(`列出文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 生成临时访问URL（用于私有bucket）
 */
export async function generatePresignedUrl(key: string, expires: number = 3600): Promise<string> {
  try {
    const client = getOSSClient();
    const url = client.signatureUrl(key, {
      expires,
    });
    return url;
  } catch (error) {
    console.error('生成临时URL失败:', error);
    throw new Error(`生成临时URL失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 导出配置和工具函数
export { ossConfig, getFileUrl };

// 常用文件夹常量
export const OSS_FOLDERS = {
  PRODUCTS: 'products',           // 商品图片
  AVATARS: 'avatars',            // 用户头像
  BRANDS: 'brands',              // 品牌图片
  CATEGORIES: 'categories',       // 分类图片
  BANNERS: 'banners',            // 轮播图
  DOCUMENTS: 'documents',         // 文档
  TEMP: 'temp',                  // 临时文件
} as const;
