import OSS from 'ali-oss';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

type UploadSource = Buffer | File;
type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

interface ThumbnailSize {
  width: number;
  height: number;
}

interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  bucket: string;
  endpoint?: string;
  folder?: string;
}

export interface UploadOptions {
  file: UploadSource;
  filename?: string;
  originalName?: string;
  folder?: string;
  mimeType?: string;
  compress?: boolean;
  format?: ImageFormat;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxSize?: number;
  generateThumbnail?: boolean;
  thumbnailSize?: ThumbnailSize;
  thumbnailQuality?: number;
  cacheControl?: string;
}

interface UploadMetadata {
  width?: number;
  height?: number;
  format?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  size?: number;
  mimeType?: string;
  metadata?: UploadMetadata;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  message?: string;
  error?: string;
  originalSize?: number;
  compressionRatio?: number;
}

class OSSError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'OSSError';
  }
}

class OSSService {
  private static instance: OSSService | null = null;

  private client: OSS | null = null;
  private config: OSSConfig | null = null;

  private constructor() {}

  public static getInstance(): OSSService {
    if (!OSSService.instance) {
      OSSService.instance = new OSSService();
    }
    return OSSService.instance;
  }

  public reset(): void {
    this.client = null;
    this.config = null;
  }

  private ensureConfig(): OSSConfig {
    if (this.config) {
      return this.config;
    }

    const env = process.env;
    const requiredVars = [
      'OSS_ACCESS_KEY_ID',
      'OSS_ACCESS_KEY_SECRET',
      'OSS_REGION',
      'OSS_BUCKET',
    ] as const;

    const missing = requiredVars.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new OSSError(
        `OSS 配置缺失: ${missing.join(', ')}`,
        'CONFIG_MISSING',
      );
    }

    const folder = env.OSS_FOLDER;

    this.config = {
      accessKeyId: env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: env.OSS_ACCESS_KEY_SECRET!,
      region: env.OSS_REGION!,
      bucket: env.OSS_BUCKET!,
      endpoint: env.OSS_ENDPOINT,
      folder: !folder || folder === '/' || folder === 'root' ? undefined : folder,
    };

    return this.config;
  }

  private getClient(): OSS {
    if (!this.client) {
      const config = this.ensureConfig();
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

  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private resolveBuffer(source: UploadSource): Promise<Buffer> {
    if (Buffer.isBuffer(source)) {
      return Promise.resolve(source);
    }
    return this.fileToBuffer(source);
  }

  private sanitizeSegment(input: string): string {
    return input.trim().replace(/^\/+|\/+$|\s+/g, '');
  }

  private resolveFolder(folder?: string): string | undefined {
    const root = this.ensureConfig().folder;
    const segments = [root, folder]
      .filter((value): value is string => Boolean(value))
      .map((value) => this.sanitizeSegment(value));
    if (segments.length === 0) {
      return undefined;
    }
    return segments.join('/');
  }

  private pickExtension(filename?: string, mimeType?: string, format?: ImageFormat): string {
    if (format) {
      return format;
    }
    if (mimeType) {
      const map: Record<string, string> = {
        'image/jpeg': 'jpeg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/avif': 'avif',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/plain': 'txt',
      };
      if (map[mimeType]) {
        return map[mimeType];
      }
    }
    if (filename?.includes('.')) {
      return filename.split('.').pop()!.toLowerCase();
    }
    return 'bin';
  }

  private resolveMimeType(filename: string, explicit?: string): string {
    if (explicit) {
      return explicit;
    }
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      avif: 'image/avif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
    };
    return ext && map[ext] ? map[ext] : 'application/octet-stream';
  }

  private isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async compressImage(
    buffer: Buffer,
    mimeType: string,
    options: {
      quality?: number;
      format?: ImageFormat;
      maxWidth?: number;
      maxHeight?: number;
    },
  ): Promise<{ buffer: Buffer; metadata?: sharp.Metadata }> {
    const {
      quality = 85,
      format,
      maxWidth = 1920,
      maxHeight = 1080,
    } = options;

    let processor = sharp(buffer, { failOn: 'none' });
    const metadata = await processor.metadata();

    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        processor = processor.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    const targetFormat: ImageFormat | undefined = format
      ? format
      : mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : mimeType === 'image/avif'
            ? 'avif'
            : 'jpeg';

    switch (targetFormat) {
      case 'png':
        processor = processor.png({ quality });
        break;
      case 'webp':
        processor = processor.webp({ quality });
        break;
      case 'avif':
        processor = processor.avif({ quality });
        break;
      default:
        processor = processor.jpeg({ quality, mozjpeg: true });
        break;
    }

    const compressed = await processor.toBuffer();
    return { buffer: compressed, metadata };
  }

  private async generateThumbnail(
    buffer: Buffer,
    size: ThumbnailSize = { width: 300, height: 300 },
    quality: number = 80,
  ): Promise<Buffer> {
    return sharp(buffer, { failOn: 'none' })
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  private generateKey(filename: string, folder?: string): string {
    const segments: string[] = [];
    const normalizedFolder = this.resolveFolder(folder);
    if (normalizedFolder) {
      segments.push(normalizedFolder);
    }
    segments.push(filename);
    return segments.join('/');
  }

  private ensureFilename(options: UploadOptions, mimeType: string): string {
    const base = options.filename || options.originalName || `${uuidv4()}`;
    const clean = base.replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (clean.includes('.')) {
      return clean;
    }
    const extension = this.pickExtension(clean, mimeType, options.format);
    return `${clean}.${extension}`;
  }

  private validateFileSize(buffer: Buffer, maxSize: number): void {
    if (buffer.length > maxSize) {
      throw new OSSError(
        `文件大小超过限制: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
        'FILE_TOO_LARGE',
      );
    }
  }

  public async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      const client = this.getClient();
      const buffer = await this.resolveBuffer(options.file);
      const originalSize = buffer.length;

      const mimeType = this.resolveMimeType(
        options.filename || options.originalName || '',
        options.mimeType,
      );

      const filename = this.ensureFilename(options, mimeType);
      const key = this.generateKey(filename, options.folder);

      const maxSize = options.maxSize ?? 10 * 1024 * 1024;
      this.validateFileSize(buffer, maxSize);

      const isImage = this.isImageMimeType(mimeType);
      const isGif = mimeType === 'image/gif' || filename.toLowerCase().endsWith('.gif');

      let processed = buffer;
      let metadata: sharp.Metadata | undefined;

      if (options.compress && isImage && !isGif) {
        try {
          const result = await this.compressImage(buffer, mimeType, {
            quality: options.quality,
            format: options.format,
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
          });
          processed = result.buffer;
          metadata = result.metadata;
        } catch (error) {
          console.warn('图片压缩失败，使用原始文件:', error);
        }
      }

      await client.put(key, processed, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': options.cacheControl ?? 'public, max-age=31536000',
        },
      });

      let thumbnailUrl: string | undefined;
      let thumbnailKey: string | undefined;

      if (options.generateThumbnail && isImage) {
        try {
          const thumbnailBuffer = await this.generateThumbnail(
            processed,
            options.thumbnailSize,
            options.thumbnailQuality,
          );
          const thumbFilename = filename.replace(/\.[^.]+$/, '') + '_thumb.jpg';
          thumbnailKey = this.generateKey(thumbFilename, options.folder);
          await client.put(thumbnailKey, thumbnailBuffer, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': options.cacheControl ?? 'public, max-age=31536000',
            },
          });
          thumbnailUrl = this.getFileUrl(thumbnailKey);
        } catch (error) {
          console.warn('生成缩略图失败:', error);
        }
      }

      const url = this.getFileUrl(key);
      const compressionRatio = originalSize > 0
        ? Number(((1 - processed.length / originalSize) * 100).toFixed(2))
        : 0;

      console.log('文件上传成功:', {
        key,
        url,
        mimeType,
        originalSize,
        processedSize: processed.length,
        compressionRatio: `${compressionRatio}%`,
      });

      return {
        success: true,
        url,
        key,
        size: processed.length,
        mimeType,
        metadata: metadata
          ? {
              width: metadata.width,
              height: metadata.height,
              format: metadata.format,
            }
          : undefined,
        thumbnailUrl,
        thumbnailKey,
        originalSize,
        compressionRatio,
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

  public async delete(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.delete(key);
      console.log('文件删除成功:', key);
      return true;
    } catch (error) {
      console.error('OSS 删除失败:', error);
      return false;
    }
  }

  public async deleteMultiple(keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    try {
      const client = this.getClient();
      await client.deleteMulti(keys, { quiet: true });
      console.log('批量删除成功:', keys.length);
    } catch (error) {
      console.warn('OSS 批量删除失败，尝试逐个删除:', error);
      await Promise.all(keys.map((key) => this.delete(key)));
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.head(key);
      return true;
    } catch {
      return false;
    }
  }

  public getFileUrl(key: string): string {
    try {
      const config = this.ensureConfig();
      if (config.endpoint) {
        return `https://${config.bucket}.${config.endpoint}/${key}`;
      }
      const region = config.region.startsWith('oss-')
        ? config.region
        : `oss-${config.region}`;
      return `https://${config.bucket}.${region}.aliyuncs.com/${key}`;
    } catch (error) {
      console.error('获取文件 URL 失败:', error);
      return '';
    }
  }

  public async getSignedUrl(key: string, expires: number = 3600): Promise<string> {
    const client = this.getClient();
    return client.signatureUrl(key, { expires });
  }
}

export const oss = OSSService.getInstance();

export const uploadFile = (options: UploadOptions) => oss.upload(options);
export const deleteFile = (key: string) => oss.delete(key);
export const deleteFiles = (keys: string[]) => oss.deleteMultiple(keys);
export const fileExists = (key: string) => oss.exists(key);
export const getFileUrl = (key: string) => oss.getFileUrl(key);
export const getSignedUrl = (key: string, expires?: number) => oss.getSignedUrl(key, expires);

export const OSS_FOLDERS = {
  PRODUCTS: 'products',
  AVATARS: 'avatars',
  CATEGORIES: 'categories',
  BANNERS: 'banners',
  DOCUMENTS: 'documents',
  TEMP: 'temp',
} as const;
