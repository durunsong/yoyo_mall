/**
 * 阿里云OSS图片URL常量
 * 所有图片都存储在阿里云OSS中
 * 使用环境变量配置，避免硬编码
 */

// OSS基础URL - 从环境变量读取
const OSS_BASE_URL = process.env.NEXT_PUBLIC_OSS_BASE_URL || process.env.BASE_OSS_URL || '';
const OSS_FOLDER = process.env.OSS_FOLDER || 'yoyo_mall';

// 生成图片URL的辅助函数
const getOssUrl = (path: string) => {
  if (!OSS_BASE_URL) {
    console.warn('OSS_BASE_URL not configured, using placeholder');
    return '/placeholder.png';
  }
  return `${OSS_BASE_URL}/${OSS_FOLDER}/${path}`;
};

// 商品图片 - 数码产品
export const ELECTRONICS_IMAGES = [
  getOssUrl('products/electronics/phone-1.jpg'),
  getOssUrl('products/electronics/laptop-1.jpg'),
  getOssUrl('products/electronics/headphone-1.jpg'),
  getOssUrl('products/electronics/tablet-1.jpg'),
  getOssUrl('products/electronics/watch-1.jpg'),
  getOssUrl('products/electronics/camera-1.jpg'),
  getOssUrl('products/electronics/speaker-1.jpg'),
  getOssUrl('products/electronics/monitor-1.jpg'),
];

// 商品图片 - 服装配饰
export const CLOTHING_IMAGES = [
  getOssUrl('products/clothing/shirt-1.jpg'),
  getOssUrl('products/clothing/dress-1.jpg'),
  getOssUrl('products/clothing/shoes-1.jpg'),
  getOssUrl('products/clothing/jacket-1.jpg'),
  getOssUrl('products/clothing/pants-1.jpg'),
  getOssUrl('products/clothing/bag-1.jpg'),
  getOssUrl('products/clothing/hat-1.jpg'),
  getOssUrl('products/clothing/accessory-1.jpg'),
];

// 商品图片 - 家居生活
export const HOME_IMAGES = [
  getOssUrl('products/home/sofa-1.jpg'),
  getOssUrl('products/home/lamp-1.jpg'),
  getOssUrl('products/home/desk-1.jpg'),
  getOssUrl('products/home/chair-1.jpg'),
  getOssUrl('products/home/decoration-1.jpg'),
  getOssUrl('products/home/kitchen-1.jpg'),
  getOssUrl('products/home/bedding-1.jpg'),
  getOssUrl('products/home/storage-1.jpg'),
];

// 用户头像
export const AVATAR_IMAGES = [
  getOssUrl('users/avatars/avatar-1.jpg'),
  getOssUrl('users/avatars/avatar-2.jpg'),
  getOssUrl('users/avatars/avatar-3.jpg'),
  getOssUrl('users/avatars/avatar-4.jpg'),
  getOssUrl('users/avatars/avatar-5.jpg'),
];

// 占位图
export const PLACEHOLDER_IMAGE = getOssUrl('placeholder.png');

// 所有图片集合
export const OSS_IMAGES = {
  electronics: ELECTRONICS_IMAGES,
  clothing: CLOTHING_IMAGES,
  home: HOME_IMAGES,
  avatars: AVATAR_IMAGES,
};

/**
 * 获取随机图片
 */
export function getRandomImage(
  category: keyof typeof OSS_IMAGES,
): string {
  const images = OSS_IMAGES[category];
  if (!images || images.length === 0) {
    return PLACEHOLDER_IMAGE;
  }
  return images[Math.floor(Math.random() * images.length)];
}

/**
 * 获取指定索引的图片
 */
export function getImage(
  category: keyof typeof OSS_IMAGES,
  index: number,
): string {
  const images = OSS_IMAGES[category];
  if (!images || images.length === 0) {
    return PLACEHOLDER_IMAGE;
  }
  return images[index % images.length];
}

/**
 * 根据分类名称获取图片
 */
export function getImageByCategory(categorySlug: string): string {
  if (categorySlug.includes('electronic') || categorySlug.includes('mobile') || categorySlug.includes('computer')) {
    return getRandomImage('electronics');
  }
  if (categorySlug.includes('clothing') || categorySlug.includes('accessories')) {
    return getRandomImage('clothing');
  }
  if (categorySlug.includes('home') || categorySlug.includes('furniture') || categorySlug.includes('kitchen')) {
    return getRandomImage('home');
  }
  return PLACEHOLDER_IMAGE;
}

