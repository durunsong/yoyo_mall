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
        {
          name: '手机数码',
          slug: 'mobile-devices',
          description: '手机和数码设备',
        },
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

  // 创建示例商品
  const mobileCategory = await prisma.category.findUnique({
    where: { slug: 'mobile-devices' },
  });
  
  const computersCategory = await prisma.category.findUnique({
    where: { slug: 'computers' },
  });
  
  const mensClothingCategory = await prisma.category.findUnique({
    where: { slug: 'mens-clothing' },
  });
  
  const furnitureCategory = await prisma.category.findUnique({
    where: { slug: 'furniture' },
  });

  // 商品数据数组 - 使用Unsplash免费图片
  const productsData = [
    // 电子产品
    {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: '全新iPhone 15 Pro，配备钛金属设计，A17 Pro芯片，专业级摄像头系统。支持USB-C接口，配备灵动岛功能。采用航天级钛金属打造，更轻更坚固。配备全新的A17 Pro芯片，性能提升20%，能效提升10%。专业级摄像系统支持7倍光学变焦，ProRAW和ProRes视频录制。',
      shortDesc: '配备A17 Pro芯片的专业级iPhone',
      sku: 'IPHONE-15-PRO-128GB',
      price: 999.0,
      comparePrice: 1099.0,
      categoryId: mobileCategory?.id,
      tags: ['smartphone', 'apple', 'iphone', 'premium'],
      quantity: 100,
      imageUrl: 'https://images.unsplash.com/photo-1592286927505-2fd5ee15aef3?w=800',
    },
    {
      name: 'MacBook Air M3',
      slug: 'macbook-air-m3',
      description: '全新MacBook Air搭载M3芯片，性能提升40%，续航长达18小时。轻薄便携，适合移动办公。13.6英寸Liquid Retina显示屏，支持10亿色彩。全新的散热系统，无风扇静音设计。',
      shortDesc: 'M3芯片超薄笔记本',
      sku: 'MACBOOK-AIR-M3-256GB',
      price: 1199.0,
      comparePrice: 1299.0,
      categoryId: computersCategory?.id,
      tags: ['laptop', 'apple', 'macbook', 'productivity'],
      quantity: 50,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    },
    {
      name: 'AirPods Pro 2',
      slug: 'airpods-pro-2',
      description: 'AirPods Pro 第二代，配备主动降噪功能，自适应通透模式，支持空间音频。H2芯片提供更智能的降噪体验，最长续航6小时。IPX4级防水，适合运动佩戴。',
      shortDesc: '主动降噪无线耳机',
      sku: 'AIRPODS-PRO-2',
      price: 249.0,
      categoryId: mobileCategory?.id,
      tags: ['earphones', 'apple', 'airpods', 'wireless'],
      quantity: 200,
      imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800',
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Galaxy S24 Ultra旗舰手机，配备S Pen触控笔，200MP主摄像头，AI图像增强。骁龙8 Gen 3处理器，12GB RAM。6.8英寸QHD+ AMOLED 2X显示屏，支持5000mAh大电池。',
      shortDesc: 'AI驱动的旗舰手机',
      sku: 'GALAXY-S24-ULTRA-256GB',
      price: 1199.0,
      comparePrice: 1299.0,
      categoryId: mobileCategory?.id,
      tags: ['smartphone', 'samsung', 'galaxy', 'android'],
      quantity: 80,
      imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
    },
    // 服装配饰
    {
      name: 'Nike Air Max 2024',
      slug: 'nike-air-max-2024',
      description: 'Nike经典气垫运动鞋2024新款，舒适透气，时尚百搭。采用回收材料制造，环保设计。Max Air气垫提供卓越的缓震效果，适合日常穿着和轻度运动。',
      shortDesc: '经典气垫运动鞋',
      sku: 'NIKE-AIRMAX-2024-42',
      price: 159.0,
      comparePrice: 189.0,
      categoryId: mensClothingCategory?.id,
      tags: ['shoes', 'nike', 'sports', 'running'],
      quantity: 150,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    },
    {
      name: 'Nike Pro 运动T恤',
      slug: 'nike-pro-tshirt',
      description: '高性能运动T恤，Dri-FIT速干技术，适合各种运动场景。采用透气网眼设计，快速排汗。修身剪裁，展现运动身材。适合健身、跑步、篮球等各类运动。',
      shortDesc: '速干运动T恤',
      sku: 'NIKE-PRO-TSHIRT-L',
      price: 45.0,
      categoryId: mensClothingCategory?.id,
      tags: ['clothing', 'nike', 'sports', 'tshirt'],
      quantity: 300,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    },
    // 家居用品
    {
      name: 'IKEA MARKUS 办公椅',
      slug: 'ikea-markus-chair',
      description: 'MARKUS人体工学办公椅，可调节高度和倾斜角度，舒适支撑，适合长时间办公。高靠背设计，提供颈部支撑。网布材质，透气舒适。承重可达110kg。',
      shortDesc: '人体工学办公椅',
      sku: 'IKEA-MARKUS-BLACK',
      price: 199.0,
      categoryId: furnitureCategory?.id,
      tags: ['furniture', 'ikea', 'chair', 'office'],
      quantity: 60,
      imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
    },
    {
      name: 'IKEA BILLY 书架',
      slug: 'ikea-billy-bookshelf',
      description: 'BILLY经典书架，可调节层板，多种尺寸可选，适合各种空间。表面经过耐磨处理，易于清洁。可与其他BILLY系列组合使用，创造个性化储物方案。',
      shortDesc: '经典可调节书架',
      sku: 'IKEA-BILLY-WHITE-80',
      price: 89.0,
      categoryId: furnitureCategory?.id,
      tags: ['furniture', 'ikea', 'bookshelf', 'storage'],
      quantity: 100,
      imageUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800',
    },
  ];

  // 创建所有商品
  for (const productData of productsData) {
    if (!productData.categoryId) continue;
    
    const { quantity, imageUrl, ...data } = productData;
    
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        currency: 'USD',
        weight: 1.0,
        status: 'PUBLISHED',
        trackInventory: true,
        allowOutOfStock: false,
        metaTitle: data.name,
        metaDesc: data.shortDesc,
        images: {
          create: [
            {
              url: imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
              alt: `${data.name} 主图`,
              sortOrder: 0,
            },
            {
              url: imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
              alt: `${data.name} 副图`,
              sortOrder: 1,
            },
          ],
        },
        inventory: {
          create: {
            quantity,
            lowStockThreshold: 10,
          },
        },
      },
    });

    console.log('✅ 商品创建完成:', product.name);
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
      value: 10.0,
      minimumAmount: 50.0,
      usageLimit: 1000,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
    },
  });

  console.log('✅ 优惠券创建完成:', coupon.code);

  console.log('🎉 数据库种子完成！');
}

main()
  .catch(e => {
    console.error('❌ 数据库种子失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
