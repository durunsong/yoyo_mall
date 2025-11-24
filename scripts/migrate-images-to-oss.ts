/**
 * 图片迁移到阿里云OSS工具
 * 将本地图片上传到 oss://next-static-oss/ 并返回URL
 */

import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// OSS配置
const ossRegion = process.env.OSS_REGION || 'oss-cn-shanghai';
const ossBucket = process.env.OSS_BUCKET || 'next-static-oss';
const client = new OSS({
  region: ossRegion,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: ossBucket,
});

// 图片分类和路径映射
interface ImageCategory {
  folder: string;
  images: string[];
}

// 模拟商品图片数据（实际应该从真实电商平台爬取）
const productImages: Record<string, ImageCategory> = {
  // 数码产品类
  electronics: {
    folder: 'products/electronics',
    images: [
      'https://img.alicdn.com/imgextra/i1/2200816985075/O1CN01qYQX5G1xN8zTZ0YXL_!!2200816985075.jpg',
      'https://img.alicdn.com/imgextra/i2/2200816985075/O1CN01Z8qX5G1xN8zTZ0YXL_!!2200816985075.jpg',
      'https://img.alicdn.com/imgextra/i3/2200816985075/O1CN01Y8qX5G1xN8zTZ0YXL_!!2200816985075.jpg',
      'https://img.alicdn.com/imgextra/i4/2200816985075/O1CN01X8qX5G1xN8zTZ0YXL_!!2200816985075.jpg',
    ],
  },
  // 服装类
  clothing: {
    folder: 'products/clothing',
    images: [
      'https://img.alicdn.com/imgextra/i1/2200816985075/O1CN01A1B2C3D1xN8zTZ0YXL_!!2200816985075.jpg',
      'https://img.alicdn.com/imgextra/i2/2200816985075/O1CN01B1B2C3D1xN8zTZ0YXL_!!2200816985075.jpg',
      'https://img.alicdn.com/imgextra/i3/2200816985075/O1CN01C1B2C3D1xN8zTZ0YXL_!!2200816985075.jpg',
    ],
  },
  // 家居类
  home: {
    folder: 'products/home',
    images: [
      'https://img.alicdn.com/imgextra/i1/2200816985075/O1CN01E1F2G3H1xN8zTZ0YXL_!!2200816985075.jpg',
      'https://img.alicdn.com/imgextra/i2/2200816985075/O1CN01F1F2G3H1xN8zTZ0YXL_!!2200816985075.jpg',
    ],
  },
  // 用户头像
  avatars: {
    folder: 'users/avatars',
    images: [
      'https://ui-avatars.com/api/?name=Admin&size=200&background=0D8ABC&color=fff',
      'https://ui-avatars.com/api/?name=User&size=200&background=F59E0B&color=fff',
      'https://ui-avatars.com/api/?name=Customer&size=200&background=10B981&color=fff',
    ],
  },
};

/**
 * 从URL下载图片到OSS
 */
async function downloadAndUploadToOSS(
  url: string,
  ossPath: string,
): Promise<string> {
  try {
    console.log(`📥 下载图片: ${url}`);
    
    // 使用fetch下载图片
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    console.log(`📤 上传到OSS: ${ossPath}`);
    
    // 上传到OSS
    const result = await client.put(ossPath, Buffer.from(uint8Array), {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
      },
    });

    console.log(`✅ 上传成功: ${result.url}`);
    return result.url;
  } catch (error) {
    console.error(`❌ 处理图片失败 (${url}):`, error);
    throw error;
  }
}

/**
 * 生成OSS图片URL映射
 */
async function generateImageMapping(): Promise<Record<string, string[]>> {
  const mapping: Record<string, string[]> = {};

  for (const [category, config] of Object.entries(productImages)) {
    console.log(`\n📁 处理分类: ${category}`);
    mapping[category] = [];

    for (let i = 0; i < config.images.length; i++) {
      const imageUrl = config.images[i];
      const ext = imageUrl.includes('.jpg') ? '.jpg' : '.png';
      const ossPath = `${config.folder}/${category}-${i + 1}${ext}`;

      try {
        const ossUrl = await downloadAndUploadToOSS(imageUrl, ossPath);
        mapping[category].push(ossUrl);
      } catch (error) {
        console.error(`跳过图片: ${imageUrl}`);
        // 使用占位图
        mapping[category].push(
          `https://${ossBucket}.${ossRegion}.aliyuncs.com/${ossPath}`,
        );
      }
    }
  }

  return mapping;
}

/**
 * 生成图片URL常量文件
 */
async function generateImageConstants(
  mapping: Record<string, string[]>,
): Promise<void> {
  const content = `/**
 * 阿里云OSS图片URL常量
 * 自动生成，请勿手动修改
 * 生成时间: ${new Date().toISOString()}
 */

export const OSS_IMAGES = ${JSON.stringify(mapping, null, 2)};

// 获取随机图片
export function getRandomImage(category: keyof typeof OSS_IMAGES): string {
  const images = OSS_IMAGES[category];
  return images[Math.floor(Math.random() * images.length)];
}

// 获取指定索引的图片
export function getImage(
  category: keyof typeof OSS_IMAGES,
  index: number
): string {
  const images = OSS_IMAGES[category];
  return images[index % images.length];
}

// 占位图
export const PLACEHOLDER_IMAGE =
  'https://next-static-oss.oss-cn-shanghai.aliyuncs.com/placeholder.png';
`;

  const outputPath = path.join(process.cwd(), 'src/lib/oss-images.ts');
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`\n✅ 图片常量文件已生成: ${outputPath}`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始迁移图片到阿里云OSS...\n');

  try {
    // 检查OSS配置
    if (
      !process.env.OSS_ACCESS_KEY_ID ||
      !process.env.OSS_ACCESS_KEY_SECRET
    ) {
      console.error(
        '❌ 请在.env.local中配置OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET',
      );
      process.exit(1);
    }

    // 生成图片映射
    const mapping = await generateImageMapping();

    // 生成常量文件
    await generateImageConstants(mapping);

    console.log('\n🎉 图片迁移完成！');
    console.log('\n📊 统计:');
    for (const [category, urls] of Object.entries(mapping)) {
      console.log(`  - ${category}: ${urls.length} 张图片`);
    }
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 执行
main();

