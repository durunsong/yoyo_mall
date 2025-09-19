/**
 * 优化版阿里云OSS工具类
 * 基于Next.js 15最佳实践，参考现代化实现
 */

import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// 环境变量类型
interface OSSEnvConfig {
  OSS_ACCESS_KEY_ID?: string;
  OSS_ACCESS_KEY_SECRET?: string;
  OSS_REGION?: string;
  OSS_BUCKET?: string;
  OSS_ENDPOINT?: string;
  OSS_FOLDER?: string;
}

// OSS配置接口
interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  bucket: string;
  endpoint?: string;
  folder: string;
}

// 支持的图片格式
type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

// 上传选项
export interface UploadOptions {
  file: Buffer | File;
  filename: string;
  folder?: string;
  compress?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  quality?: number;
  format?: ImageFormat;
  maxSize?: number; // 最大文件大小（字节）
}

// 上传结果
export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
  };
}

// 错误类型
export class OSSError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'OSSError';
  }
}

/**
 * OSS工具类
 */
export class OSSService {
  private static instance: OSSService;
  private client: OSS | null = null;
  private config: OSSConfig | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): OSSService {
    if (!OSSService.instance) {
      OSSService.instance = new OSSService();
    }
    return OSSService.instance;
  }

  /**
   * 初始化配置
   */
  private getConfig(): OSSConfig {
    if (this.config) {
      return this.config;
    }

    const env = process.env as OSSEnvConfig;

    const requiredFields = [
      'OSS_ACCESS_KEY_ID',
      'OSS_ACCESS_KEY_SECRET',
      'OSS_REGION',
      'OSS_BUCKET',
    ] as const;

    const missing = requiredFields.filter(field => !env[field]);
    if (missing.length > 0) {
      throw new OSSError(
        `OSS配置缺失: ${missing.join(', ')}`,
        'CONFIG_MISSING',
      );
    }

    this.config = {
      accessKeyId: env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: env.OSS_ACCESS_KEY_SECRET!,
      region: env.OSS_REGION!,
      bucket: env.OSS_BUCKET!,
      endpoint: env.OSS_ENDPOINT,
      folder: env.OSS_FOLDER || 'uploads',
    };

    return this.config;
  }

  /**
   * 获取OSS客户端
   */
  private getClient(): OSS {
    if (!this.client) {
      const config = this.getConfig();
      this.client = new OSS({
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        region: config.region,
        bucket: config.bucket,
        endpoint: config.endpoint,
      });
    }
    return this.client;
  }

  /**
   * 生成唯一的文件key
   */
  private generateKey(filename: string, folder?: string): string {
    const config = this.getConfig();
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const uuid = uuidv4().replace(/-/g, '');
    const timestamp = Date.now();
    const fileName = `${uuid}_${timestamp}.${ext}`;

    const folderPath = folder ? `${config.folder}/${folder}` : config.folder;
    return `${folderPath}/${fileName}`;
  }

  /**
   * 获取文件URL
   */
  public getFileUrl(key: string): string {
    const config = this.getConfig();
    if (config.endpoint) {
      return `https://${config.bucket}.${config.endpoint}/${key}`;
    }
    return `https://${config.bucket}.oss-${config.region}.aliyuncs.com/${key}`;
  }

  /**
   * 压缩图片
   */
  private async compressImage(
    buffer: Buffer,
    options: {
      quality?: number;
      format?: ImageFormat;
      maxWidth?: number;
      maxHeight?: number;
    } = {},
  ): Promise<{ buffer: Buffer; metadata: sharp.Metadata }> {
    const {
      quality = 85,
      format = 'jpeg',
      maxWidth = 1920,
      maxHeight = 1080,
    } = options;

    let processor = sharp(buffer);
    const metadata = await processor.metadata();

    // 调整尺寸
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        processor = processor.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    // 格式转换和压缩
    switch (format) {
      case 'jpeg':
        processor = processor.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        processor = processor.png({ quality });
        break;
      case 'webp':
        processor = processor.webp({ quality });
        break;
      case 'avif':
        processor = processor.avif({ quality });
        break;
    }

    const compressedBuffer = await processor.toBuffer();
    return { buffer: compressedBuffer, metadata };
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(
    buffer: Buffer,
    size: { width: number; height: number } = { width: 300, height: 300 },
    quality: number = 80,
  ): Promise<Buffer> {
    return await sharp(buffer)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  /**
   * 验证文件
   */
  private validateFile(file: Buffer | File, options: UploadOptions): void {
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 默认10MB
    const fileSize = file instanceof Buffer ? file.length : (file as File).size;

    if (fileSize > maxSize) {
      throw new OSSError(
        `文件大小超过限制: ${Math.round(fileSize / 1024 / 1024)}MB > ${Math.round(maxSize / 1024 / 1024)}MB`,
        'FILE_TOO_LARGE',
      );
    }

    // 验证文件扩展名
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'svg',
      'pdf',
      'doc',
      'docx',
      'txt',
    ];
    const ext = options.filename.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      throw new OSSError(
        `不支持的文件类型: ${ext}`,
        'UNSUPPORTED_FILE_TYPE',
      );
    }
  }

  /**
   * 将File转换为Buffer
   */
  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * 上传文件
   */
  public async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      this.validateFile(options.file, options);

      let buffer: Buffer;
      if (options.file instanceof Buffer) {
        buffer = options.file;
      } else {
        buffer = await this.fileToBuffer(options.file as File);
      }

      const mimeType = this.getMimeType(options.filename);
      const isImage = mimeType.startsWith('image/');
      let processedBuffer = buffer;
      let metadata: sharp.Metadata | undefined;

      // 图片处理
      if (isImage && options.compress) {
        const result = await this.compressImage(buffer, {
          quality: options.quality,
          format: options.format,
        });
        processedBuffer = result.buffer;
        metadata = result.metadata;
      }

      // 生成文件key
      const key = this.generateKey(options.filename, options.folder);
      const client = this.getClient();

      // 上传主文件
      await client.put(key, processedBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000', // 1年缓存
        },
      });

      const result: UploadResult = {
        url: this.getFileUrl(key),
        key,
        size: processedBuffer.length,
        mimeType,
        metadata: metadata
          ? {
              width: metadata.width,
              height: metadata.height,
              format: metadata.format,
            }
          : undefined,
      };

      // 生成缩略图
      if (isImage && options.generateThumbnail) {
        try {
          const thumbnailBuffer = await this.generateThumbnail(
            processedBuffer,
            options.thumbnailSize,
            options.quality,
          );
          const thumbnailKey = this.generateKey(
            `thumb_${options.filename}`,
            options.folder,
          );

          await client.put(thumbnailKey, thumbnailBuffer, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=31536000',
            },
          });

          result.thumbnailUrl = this.getFileUrl(thumbnailKey);
          result.thumbnailKey = thumbnailKey;
        } catch (thumbnailError) {
          console.warn('生成缩略图失败:', thumbnailError);
        }
      }

      console.log('文件上传成功:', { key, size: result.size });
      return result;
    } catch (error) {
      if (error instanceof OSSError) {
        throw error;
      }
      console.error('OSS上传失败:', error);
      throw new OSSError(
        `上传失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'UPLOAD_FAILED',
      );
    }
  }

  /**
   * 删除文件
   */
  public async delete(key: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.delete(key);
      console.log('文件删除成功:', key);
    } catch (error) {
      console.error('OSS删除失败:', error);
      throw new OSSError(
        `删除失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'DELETE_FAILED',
      );
    }
  }

  /**
   * 批量删除文件
   */
  public async deleteMultiple(keys: string[]): Promise<void> {
    try {
      const client = this.getClient();
      await client.deleteMulti(keys);
      console.log('批量删除成功:', keys.length);
    } catch (error) {
      console.error('OSS批量删除失败:', error);
      throw new OSSError(
        `批量删除失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'BATCH_DELETE_FAILED',
      );
    }
  }

  /**
   * 检查文件是否存在
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.head(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件信息
   */
  public async getFileInfo(key: string) {
    try {
      const client = this.getClient();
      const result = await client.head(key);
      const headers = result.res.headers as Record<string, string>;

      return {
        size: parseInt(headers['content-length'] || '0'),
        mimeType: headers['content-type'],
        lastModified: headers['last-modified'],
        etag: headers.etag,
      };
    } catch (error) {
      throw new OSSError(
        `获取文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'GET_INFO_FAILED',
      );
    }
  }

  /**
   * 生成签名URL（用于私有访问）
   */
  public async getSignedUrl(
    key: string,
    expires: number = 3600,
  ): Promise<string> {
    try {
      const client = this.getClient();
      return client.signatureUrl(key, { expires });
    } catch (error) {
      throw new OSSError(
        `生成签名URL失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'SIGNED_URL_FAILED',
      );
    }
  }
}

// 导出单例实例
export const oss = OSSService.getInstance();

// 导出常用文件夹常量
export const OSS_FOLDERS = {
  PRODUCTS: 'products',
  AVATARS: 'avatars',
  BRANDS: 'brands',
  CATEGORIES: 'categories',
  BANNERS: 'banners',
  DOCUMENTS: 'documents',
  TEMP: 'temp',
} as const;

// 便捷函数
export const uploadFile = (options: UploadOptions) => oss.upload(options);
export const deleteFile = (key: string) => oss.delete(key);
export const fileExists = (key: string) => oss.exists(key);
export const getFileUrl = (key: string) => oss.getFileUrl(key);
