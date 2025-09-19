/**
 * 数据库种子文件
 * 用于初始化基础数据
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子...');

  // 创建管理员用户
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@yoyomall.com' },
    update: {},
    create: {
      email: 'admin@yoyomall.com',
      name: '系统管理员',
      password: await bcrypt.hash('admin123456', 12),
      role: 'SUPER_ADMIN',
      profile: {
        create: {
          firstName: '系统',
          lastName: '管理员',
          locale: 'zh-CN',
          timezone: 'Asia/Shanghai',
        },
      },
    },
  });

  console.log('✅ 管理员用户创建完成:', adminUser.email);

  // 创建测试用户
  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: '测试用户',
      password: await bcrypt.hash('password123', 12),
      role: 'CUSTOMER',
      profile: {
        create: {
          firstName: '测试',
          lastName: '用户',
          phone: '13800138000',
          locale: 'zh-CN',
          timezone: 'Asia/Shanghai',
        },
      },
    },
  });

  console.log('✅ 测试用户创建完成:', testUser.email);

  // 创建商品分类
  const categories = [
    {
      name: '服装配饰',
      slug: 'clothing-accessories',
      description: '时尚服装和配饰',
      children: [
        { name: '男装', slug: 'mens-clothing', description: '男士服装' },
        { name: '女装', slug: 'womens-clothing', description: '女士服装' },
        { name: '配饰', slug: 'accessories', description: '时尚配饰' },
      ],
    },
    {
      name: '数码产品',
      slug: 'electronics',
      description: '电子产品和数码设备',
      children: [
        { name: '手机数码', slug: 'mobile-devices', description: '手机和数码设备' },
        { name: '电脑办公', slug: 'computers', description: '电脑和办公设备' },
        { name: '家用电器', slug: 'home-appliances', description: '家用电器' },
      ],
    },
    {
      name: '家居生活',
      slug: 'home-living',
      description: '家居用品和生活用品',
      children: [
        { name: '家具', slug: 'furniture', description: '家具用品' },
        { name: '装饰', slug: 'decoration', description: '装饰用品' },
        { name: '厨具', slug: 'kitchenware', description: '厨房用具' },
      ],
    },
  ];

  for (const categoryData of categories) {
    const { children, ...parentData } = categoryData;
    
    const parentCategory = await prisma.category.upsert({
      where: { slug: parentData.slug },
      update: {},
      create: {
        ...parentData,
        isActive: true,
        sortOrder: categories.indexOf(categoryData),
      },
    });

    console.log('✅ 父级分类创建完成:', parentCategory.name);

    // 创建子分类
    for (const childData of children) {
      const childCategory = await prisma.category.upsert({
        where: { slug: childData.slug },
        update: {},
        create: {
          ...childData,
          parentId: parentCategory.id,
          isActive: true,
          sortOrder: children.indexOf(childData),
        },
      });

      console.log('✅ 子级分类创建完成:', childCategory.name);
    }
  }

  // 创建品牌
  const brands = [
    { name: 'Apple', slug: 'apple', description: '苹果公司' },
    { name: 'Samsung', slug: 'samsung', description: '三星公司' },
    { name: 'Nike', slug: 'nike', description: '耐克运动品牌' },
    { name: 'Adidas', slug: 'adidas', description: '阿迪达斯运动品牌' },
    { name: 'IKEA', slug: 'ikea', description: '宜家家居' },
  ];

  for (const brandData of brands) {
    const brand = await prisma.brand.upsert({
      where: { slug: brandData.slug },
      update: {},
      create: {
        ...brandData,
        isActive: true,
      },
    });

    console.log('✅ 品牌创建完成:', brand.name);
  }

  // 创建示例商品
  const electronicsCategory = await prisma.category.findUnique({
    where: { slug: 'mobile-devices' },
  });

  const appleBrand = await prisma.brand.findUnique({
    where: { slug: 'apple' },
  });

  if (electronicsCategory && appleBrand) {
    const product = await prisma.product.upsert({
      where: { slug: 'iphone-15-pro' },
      update: {},
      create: {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: '全新iPhone 15 Pro，配备钛金属设计，A17 Pro芯片，专业级摄像头系统。',
        shortDesc: '配备A17 Pro芯片的专业级iPhone',
        sku: 'IPHONE-15-PRO-128GB',
        price: 999.00,
        comparePrice: 1099.00,
        currency: 'USD',
        weight: 187.0,
        categoryId: electronicsCategory.id,
        brandId: appleBrand.id,
        status: 'PUBLISHED',
        trackInventory: true,
        allowOutOfStock: false,
        metaTitle: 'iPhone 15 Pro - 专业级智能手机',
        metaDesc: '购买全新iPhone 15 Pro，享受先进的A17 Pro芯片性能和专业摄影体验。',
        tags: ['smartphone', 'apple', 'iphone', 'premium'],
        images: {
          create: [
            {
              url: '/images/products/iphone-15-pro-1.jpg',
              alt: 'iPhone 15 Pro 正面',
              sortOrder: 0,
            },
            {
              url: '/images/products/iphone-15-pro-2.jpg',
              alt: 'iPhone 15 Pro 背面',
              sortOrder: 1,
            },
          ],
        },
        inventory: {
          create: {
            quantity: 100,
            lowStockThreshold: 10,
          },
        },
      },
    });

    console.log('✅ 示例商品创建完成:', product.name);
  }

  // 创建优惠券
  const coupon = await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      name: '新用户欢迎优惠',
      description: '新用户首次购买享受10%折扣',
      type: 'PERCENTAGE',
      value: 10.00,
      minimumAmount: 50.00,
      usageLimit: 1000,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
    },
  });

  console.log('✅ 优惠券创建完成:', coupon.code);

  console.log('🎉 数据库种子完成！');
}

main()
  .catch((e) => {
    console.error('❌ 数据库种子失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
