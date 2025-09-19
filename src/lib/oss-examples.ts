/**
 * OSS工具类使用示例
 * 展示如何在Next.js 15中使用优化版OSS服务
 */

import { oss, uploadFile, deleteFile, OSS_FOLDERS, type UploadOptions } from './oss-improved';

// 1. 基础文件上传示例
export async function uploadProductImage(file: File) {
  try {
    const options: UploadOptions = {
      file,
      filename: file.name,
      folder: OSS_FOLDERS.PRODUCTS,
      compress: true,
      generateThumbnail: true,
      quality: 85,
      format: 'webp', // 使用现代格式
      thumbnailSize: { width: 300, height: 300 },
      maxSize: 5 * 1024 * 1024, // 5MB限制
    };

    const result = await uploadFile(options);
    
    return {
      success: true,
      data: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        key: result.key,
        size: result.size,
        metadata: result.metadata,
      },
    };
  } catch (error) {
    console.error('商品图片上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
  }
}

// 2. 用户头像上传示例
export async function uploadUserAvatar(file: File, userId: string) {
  try {
    // 先删除旧头像（如果存在）
    const oldAvatarKey = `${OSS_FOLDERS.AVATARS}/user_${userId}.webp`;
    if (await oss.exists(oldAvatarKey)) {
      await deleteFile(oldAvatarKey);
    }

    const options: UploadOptions = {
      file,
      filename: `user_${userId}.webp`,
      folder: OSS_FOLDERS.AVATARS,
      compress: true,
      quality: 90,
      format: 'webp',
      maxSize: 2 * 1024 * 1024, // 2MB限制
    };

    const result = await uploadFile(options);
    
    return {
      success: true,
      avatarUrl: result.url,
    };
  } catch (error) {
    console.error('头像上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '头像上传失败',
    };
  }
}

// 3. 多文件批量上传示例
export async function uploadMultipleFiles(
  files: File[],
  folder: string = OSS_FOLDERS.TEMP,
) {
  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      const options: UploadOptions = {
        file,
        filename: file.name,
        folder,
        compress: file.type.startsWith('image/'),
        generateThumbnail: file.type.startsWith('image/'),
        quality: 85,
        maxSize: 10 * 1024 * 1024, // 10MB限制
      };

      const result = await uploadFile(options);
      results.push({
        filename: file.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        key: result.key,
        size: result.size,
      });
    } catch (error) {
      errors.push({
        filename: file.name,
        error: error instanceof Error ? error.message : '上传失败',
      });
    }
  }

  return {
    success: results.length > 0,
    results,
    errors,
    total: files.length,
    uploaded: results.length,
    failed: errors.length,
  };
}

// 4. 文档上传示例（PDF, DOC等）
export async function uploadDocument(file: File, category: string = 'general') {
  try {
    const options: UploadOptions = {
      file,
      filename: file.name,
      folder: `${OSS_FOLDERS.DOCUMENTS}/${category}`,
      compress: false, // 文档不压缩
      maxSize: 20 * 1024 * 1024, // 20MB限制
    };

    const result = await uploadFile(options);
    
    return {
      success: true,
      document: {
        name: file.name,
        url: result.url,
        key: result.key,
        size: result.size,
        mimeType: result.mimeType,
      },
    };
  } catch (error) {
    console.error('文档上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '文档上传失败',
    };
  }
}

// 5. 获取签名URL示例（用于私有文件访问）
export async function getPrivateFileUrl(key: string, expires: number = 3600) {
  try {
    const signedUrl = await oss.getSignedUrl(key, expires);
    return {
      success: true,
      url: signedUrl,
      expiresIn: expires,
    };
  } catch (error) {
    console.error('获取签名URL失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取签名URL失败',
    };
  }
}

// 6. 文件管理示例
export async function manageFiles() {
  try {
    // 检查文件是否存在
    const key = 'products/sample.jpg';
    const exists = await oss.exists(key);
    
    if (exists) {
      // 获取文件信息
      const fileInfo = await oss.getFileInfo(key);
      console.log('文件信息:', fileInfo);
      
      // 删除文件
      await deleteFile(key);
      console.log('文件已删除');
    }
    
    return { success: true };
  } catch (error) {
    console.error('文件管理失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '文件管理失败',
    };
  }
}

// 7. 清理临时文件示例
export async function cleanupTempFiles(olderThanDays: number = 7) {
  try {
    // 这里需要实现列出文件的逻辑
    // 由于当前OSS类没有列出文件的方法，这里只是示例结构
    console.log(`清理${olderThanDays}天前的临时文件`);
    
    // 实际实现中，你需要：
    // 1. 列出临时文件夹中的所有文件
    // 2. 检查文件的创建时间
    // 3. 删除超过指定天数的文件
    
    return {
      success: true,
      cleaned: 0, // 已清理的文件数量
    };
  } catch (error) {
    console.error('清理临时文件失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '清理失败',
    };
  }
}

// 8. 图片格式转换示例
export async function convertImageFormat(
  file: File,
  targetFormat: 'jpeg' | 'png' | 'webp' | 'avif' = 'webp',
) {
  try {
    const options: UploadOptions = {
      file,
      filename: file.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
      folder: OSS_FOLDERS.TEMP,
      compress: true,
      format: targetFormat,
      quality: 85,
      maxSize: 10 * 1024 * 1024,
    };

    const result = await uploadFile(options);
    
    return {
      success: true,
      originalFormat: file.type,
      convertedFormat: targetFormat,
      originalSize: file.size,
      convertedSize: result.size,
      compressionRatio: ((file.size - result.size) / file.size * 100).toFixed(2),
      url: result.url,
    };
  } catch (error) {
    console.error('图片格式转换失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '格式转换失败',
    };
  }
}
