import OSS from 'ali-oss';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// OSS 配置接口
interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  bucket: string;
  endpoint?: string;
}

// 上传选项接口
export interface UploadOptions {
  file: File | Buffer;
  filename?: string;
  folder?: string;
  compress?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// 上传结果接口
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  size?: number;
  message?: string;
  error?: string;
}

/**
 * 阿里云 OSS 工具类
 */
export class OSSManager {
  private client: OSS | null = null;
  private config: OSSConfig | null = null;

  constructor() {
    this.initializeConfig();
  }

  /**
   * 初始化 OSS 配置
   */
  private initializeConfig(): void {
    const requiredEnvVars = {
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      region: process.env.OSS_REGION,
      bucket: process.env.OSS_BUCKET,
    };

    // 检查必需的环境变量
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        console.error(`OSS 配置错误: 缺少环境变量 ${key.toUpperCase()}`);
        return;
      }
    }

    this.config = {
      ...requiredEnvVars as Required<typeof requiredEnvVars>,
      endpoint: process.env.OSS_ENDPOINT,
    };

    try {
      this.client = new OSS(this.config);
      console.log('OSS 客户端初始化成功');
    } catch (error) {
      console.error('OSS 客户端初始化失败:', error);
    }
  }

  /**
   * 检查 OSS 是否已正确配置
   */
  private isConfigured(): boolean {
    return !!(this.client && this.config);
  }

  /**
   * 将 File 对象转换为 Buffer
   */
  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * 压缩图片
   */
  private async compressImage(
    buffer: Buffer,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<Buffer> {
    const { quality = 80, maxWidth = 1920, maxHeight = 1080 } = options;

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

    // 压缩并转换为 WebP 格式
    return await sharpInstance
      .webp({ quality })
      .toBuffer();
  }

  /**
   * 上传文件到 OSS
   */
  public async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'OSS 未正确配置，请检查环境变量',
        };
      }

      let buffer: Buffer;
      let originalSize: number;

      // 处理文件输入
      if (options.file instanceof Buffer) {
        buffer = options.file;
        originalSize = buffer.length;
      } else {
        buffer = await this.fileToBuffer(options.file);
        originalSize = options.file.size;
      }

      // 生成文件名
      const filename = options.filename || `${uuidv4()}.webp`;
      const folder = options.folder || 'uploads';
      const key = `${folder}/${filename}`;

      // 压缩图片（如果启用）
      if (options.compress && buffer) {
        try {
          buffer = await this.compressImage(buffer, {
            quality: options.quality,
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
          });
        } catch (compressError) {
          console.warn('图片压缩失败，使用原始文件:', compressError);
        }
      }

      // 上传到 OSS
      const result = await this.client!.put(key, buffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000', // 1年缓存
        },
      });

      // 构建完整的 URL
      const url = `https://${this.config!.bucket}.${this.config!.region}.aliyuncs.com/${key}`;

      console.log('文件上传成功:', {
        key,
        url,
        originalSize,
        compressedSize: buffer.length,
        compressionRatio: ((originalSize - buffer.length) / originalSize * 100).toFixed(2) + '%',
      });

      return {
        success: true,
        url,
        key,
        size: buffer.length,
        message: '上传成功',
      };

    } catch (error) {
      console.error('OSS 上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  /**
   * 删除文件
   */
  public async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.error('OSS 未正确配置');
        return false;
      }

      await this.client!.delete(key);
      console.log('文件删除成功:', key);
      return true;
    } catch (error) {
      console.error('OSS 删除失败:', error);
      return false;
    }
  }

  /**
   * 检查文件是否存在
   */
  public async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      await this.client!.head(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取文件 URL
   */
  public getFileUrl(key: string): string {
    if (!this.config) {
      return '';
    }
    return `https://${this.config.bucket}.${this.config.region}.aliyuncs.com/${key}`;
  }
}

// 导出单例实例
export const ossManager = new OSSManager();

// 导出便捷方法
export const uploadFile = (options: UploadOptions) => ossManager.upload(options);
export const deleteFile = (key: string) => ossManager.delete(key);
export const fileExists = (key: string) => ossManager.exists(key);
export const getFileUrl = (key: string) => ossManager.getFileUrl(key);

// 常用文件夹常量，供业务统一引用
export const OSS_FOLDERS = {
  PRODUCTS: 'products',
  AVATARS: 'avatars',
  BRANDS: 'brands',
  CATEGORIES: 'categories',
  BANNERS: 'banners',
  DOCUMENTS: 'documents',
  TEMP: 'temp',
} as const;

// 批量删除
export const deleteFiles = async (keys: string[]) => {
  await Promise.all(keys.map((k) => deleteFile(k)));
};