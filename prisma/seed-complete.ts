// @ts-nocheck

/**
 * 完整的数据库种子文件
 * 包含完整的订单流程测试数据
 * 所有图片使用阿里云OSS
 */

import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus, AddressType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  ELECTRONICS_IMAGES,
  CLOTHING_IMAGES,
  HOME_IMAGES,
  AVATAR_IMAGES,
  getRandomImage,
  getImage,
} from '../src/lib/oss-images';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始完整数据库种子...\n');

  // ============================================
  // 1. 创建用户
  // ============================================
  console.log('👤 创建用户...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@yoyomall.com' },
    update: {},
    create: {
      email: 'admin@yoyomall.com',
      name: '系统管理员',
      password: await bcrypt.hash('admin123456', 12),
      role: 'SUPER_ADMIN',
      avatar: AVATAR_IMAGES[0],
      profile: {
        create: {
          firstName: '系统',
          lastName: '管理员',
          phone: '13900000000',
          locale: 'zh-CN',
          timezone: 'Asia/Shanghai',
        },
      },
    },
  });

  const testUsers = [];
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@example.com` },
      update: {},
      create: {
        email: `user${i}@example.com`,
        name: `测试用户${i}`,
        password: await bcrypt.hash('password123', 12),
        role: 'CUSTOMER',
        avatar: AVATAR_IMAGES[i % AVATAR_IMAGES.length],
        profile: {
          create: {
            firstName: `测试${i}`,
            lastName: '用户',
            phone: `1380013800${i}`,
            locale: 'zh-CN',
            timezone: 'Asia/Shanghai',
          },
        },
      },
    });
    testUsers.push(user);
  }

  console.log(`✅ 用户创建完成: 1个管理员 + ${testUsers.length}个测试用户\n`);

  // ============================================
  // 2. 创建分类
  // ============================================
  console.log('📁 创建分类...');

  const categories = [
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

  const createdCategories: any[] = [];
  for (const categoryData of categories) {
    const { children, ...parentData } = categoryData;

    const parentCategory = await prisma.category.upsert({
      where: { slug: parentData.slug },
      update: {},
      create: {
        ...parentData,
        sortOrder: createdCategories.length,
        isActive: true,
      },
    });

    createdCategories.push(parentCategory);

    if (children) {
      for (let i = 0; i < children.length; i++) {
        const childCategory = await prisma.category.upsert({
          where: { slug: children[i].slug },
          update: {},
          create: {
            ...children[i],
            parentId: parentCategory.id,
            sortOrder: i,
            isActive: true,
          },
        });
        createdCategories.push(childCategory);
      }
    }
  }

  console.log(`✅ 分类创建完成: ${createdCategories.length}个分类\n`);

  // ============================================
  // 3. 创建商品
  // ============================================
  console.log('📦 创建商品...');

  // 数码产品
  const electronicsProducts = [
    {
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      description: '最新旗舰iPhone，搭载A17 Pro芯片，钛金属设计',
      shortDesc: 'Apple旗舰手机',
      price: 9999,
      comparePrice: 10999,
      sku: 'IPHONE-15-PM-256',
      images: [ELECTRONICS_IMAGES[0]],
      categorySlug: 'mobile-devices',
      stock: 50,
    },
    {
      name: 'MacBook Pro 16英寸',
      slug: 'macbook-pro-16',
      description: 'M3 Max芯片，16英寸Liquid Retina XDR显示屏',
      shortDesc: '专业笔记本',
      price: 25999,
      comparePrice: 27999,
      sku: 'MBP-16-M3MAX-1TB',
      images: [ELECTRONICS_IMAGES[1]],
      categorySlug: 'computers',
      stock: 30,
    },
    {
      name: 'AirPods Pro 2代',
      slug: 'airpods-pro-2',
      description: '主动降噪，自适应透明模式，空间音频',
      shortDesc: '无线降噪耳机',
      price: 1999,
      comparePrice: 2299,
      sku: 'AIRPODS-PRO-2',
      images: [ELECTRONICS_IMAGES[2]],
      categorySlug: 'mobile-devices',
      stock: 100,
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-s24-ultra',
      description: '骁龙8 Gen 3，6.8英寸Dynamic AMOLED 2X',
      shortDesc: '三星旗舰手机',
      price: 8999,
      comparePrice: 9999,
      sku: 'SAMSUNG-S24U-256',
      images: [ELECTRONICS_IMAGES[3]],
      categorySlug: 'mobile-devices',
      stock: 40,
    },
  ];

  // 服装产品
  const clothingProducts = [
    {
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      description: '经典气垫跑鞋，舒适透气',
      shortDesc: 'Nike运动鞋',
      price: 1299,
      comparePrice: 1599,
      sku: 'NIKE-AM270-42',
      images: [CLOTHING_IMAGES[0]],
      categorySlug: 'accessories',
      stock: 80,
    },
    {
      name: 'Adidas Ultraboost 23',
      slug: 'adidas-ultraboost-23',
      description: 'Boost中底，舒适回弹',
      shortDesc: 'Adidas跑鞋',
      price: 1499,
      comparePrice: 1799,
      sku: 'ADIDAS-UB23-42',
      images: [CLOTHING_IMAGES[1]],
      categorySlug: 'accessories',
      stock: 60,
    },
    {
      name: 'Zara基础款T恤',
      slug: 'zara-basic-tshirt',
      description: '100%纯棉，多色可选',
      shortDesc: '基础T恤',
      price: 99,
      comparePrice: 149,
      sku: 'ZARA-TS-M-WHT',
      images: [CLOTHING_IMAGES[2]],
      categorySlug: 'mens-clothing',
      stock: 200,
    },
  ];

  // 家居产品
  const homeProducts = [
    {
      name: 'IKEA Billy书架',
      slug: 'ikea-billy-bookshelf',
      description: '经典Billy系列，可调节隔板',
      shortDesc: '实木书架',
      price: 399,
      comparePrice: 499,
      sku: 'IKEA-BILLY-WHT',
      images: [HOME_IMAGES[0]],
      categorySlug: 'furniture',
      stock: 50,
    },
    {
      name: 'IKEA Poäng休闲椅',
      slug: 'ikea-poang-chair',
      description: '弹性木框架，舒适坐感',
      shortDesc: '休闲扶手椅',
      price: 699,
      comparePrice: 899,
      sku: 'IKEA-POANG-BRN',
      images: [HOME_IMAGES[1]],
      categorySlug: 'furniture',
      stock: 35,
    },
  ];

  const allProductsData = [
    ...electronicsProducts,
    ...clothingProducts,
    ...homeProducts,
  ];

  const createdProducts = [];
  for (const productData of allProductsData) {
    const { categorySlug, stock, ...data } = productData;

    // 找到对应的分类
    const category = createdCategories.find((c) => c.slug === categorySlug);
    if (!category) continue;

    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        categoryId: category.id,
        currency: 'CNY',
        status: 'PUBLISHED',
        allowOutOfStock: false,
        trackInventory: true,
        inventory: {
          create: {
            quantity: stock,
            reservedQuantity: 0,
            lowStockThreshold: 10,
          },
        },
      },
      include: {
        inventory: true,
      },
    });

    createdProducts.push(product);
  }

  console.log(`✅ 商品创建完成: ${createdProducts.length}个商品\n`);

  // ============================================
  // 5. 创建地址
  // ============================================
  console.log('📍 创建收货地址...');

  const addresses = [];
  for (const [index, user] of testUsers.entries()) {
    const [firstName, lastName] = (user.name || '收货人').split(/(?<=\S)\s+/);
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        type: AddressType.SHIPPING,
        firstName: firstName || '收货人',
        lastName: lastName || '',
        phone: `1380013800${index + 1}`,
        company: null,
        addressLine1: '世纪大道1000号',
        addressLine2: `${index + 1}号楼`,
        city: '上海市',
        state: '上海市',
        postalCode: '200120',
        country: '中国',
        isDefault: true,
      },
    });
    addresses.push(address);
  }

  console.log(`✅ 地址创建完成: ${addresses.length}个地址\n`);

  // ============================================
  // 6. 创建完整订单流程
  // ============================================
  console.log('🛒 创建订单（完整流程）...\n');

  // 订单状态和对应的商品
  const orderScenarios = [
    {
      user: testUsers[0],
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      products: [createdProducts[0], createdProducts[4]],
      description: '待支付订单',
    },
    {
      user: testUsers[0],
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.COMPLETED,
      products: [createdProducts[1]],
      description: '处理中订单（已支付）',
    },
    {
      user: testUsers[1],
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.COMPLETED,
      products: [createdProducts[2], createdProducts[5]],
      description: '已发货订单',
      trackingNumber: 'SF1234567890',
    },
    {
      user: testUsers[1],
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.COMPLETED,
      products: [createdProducts[3]],
      description: '已送达订单',
      trackingNumber: 'YTO9876543210',
    },
    {
      user: testUsers[2],
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.COMPLETED,
      products: [createdProducts[6], createdProducts[7]],
      description: '已完成订单',
      trackingNumber: 'JD1122334455',
    },
    {
      user: testUsers[2],
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.REFUNDED,
      products: [createdProducts[8]],
      description: '已取消订单（已退款）',
    },
  ];

  const createdOrders = [];
  for (let i = 0; i < orderScenarios.length; i++) {
    const scenario = orderScenarios[i];
    const address = addresses.find((a) => a.userId === scenario.user.id);
    if (!address) continue;

    // 计算订单金额
    let subtotal = 0;
    const orderItems = scenario.products.map((product, index) => {
      const quantity = Math.floor(Math.random() * 3) + 1;
      subtotal += product.price * quantity;
      return {
        productId: product.id,
        quantity,
        price: product.price,
        subtotal: product.price * quantity,
      };
    });

    const shippingCost = subtotal > 500 ? 0 : 15;
    const tax = Math.round(subtotal * 0.06);
    const total = subtotal + shippingCost + tax;

    // 生成订单号
    const orderNumber = `YM${Date.now()}${i.toString().padStart(3, '0')}`;

    // 创建订单
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: scenario.user.id,
        status: scenario.status,
        subtotal,
        shippingCost,
        tax,
        total,
        currency: 'CNY',
        // 收货地址
        shippingFullName: address.fullName,
        shippingPhone: address.phone,
        shippingProvince: address.province,
        shippingCity: address.city,
        shippingDistrict: address.district,
        shippingAddressLine1: address.addressLine1,
        shippingAddressLine2: address.addressLine2,
        shippingPostalCode: address.postalCode,
        // 物流信息
        trackingNumber: scenario.trackingNumber || null,
        // 订单项
        items: {
          create: orderItems,
        },
        // 支付信息
        payments: {
          create: [
            {
              amount: total,
              currency: 'CNY',
              method: PaymentMethod.ALIPAY,
              status: scenario.paymentStatus,
              transactionId:
                scenario.paymentStatus === PaymentStatus.COMPLETED
                  ? `TXN${Date.now()}${i}`
                  : null,
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    createdOrders.push(order);
    console.log(`  ✅ ${scenario.description}: ${order.orderNumber}`);
  }

  console.log(`\n✅ 订单创建完成: ${createdOrders.length}个订单\n`);

  // ============================================
  // 7. 创建评论
  // ============================================
  console.log('💬 创建商品评论...');

  const reviews = [];
  for (let i = 0; i < 5; i++) {
    const user = testUsers[i % testUsers.length];
    const product = createdProducts[i % createdProducts.length];

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5星
        title: '非常满意',
        content: '商品质量很好，物流快速，客服态度好，推荐购买！',
        verified: true,
      },
    });
    reviews.push(review);
  }

  console.log(`✅ 评论创建完成: ${reviews.length}条评论\n`);

  // ============================================
  // 统计信息
  // ============================================
  console.log('\n📊 数据统计:');
  console.log(`  - 用户: ${testUsers.length + 1}个`);
  console.log(`  - 分类: ${createdCategories.length}个`);
  console.log(`  - 商品: ${createdProducts.length}个`);
  console.log(`  - 地址: ${addresses.length}个`);
  console.log(`  - 订单: ${createdOrders.length}个`);
  console.log(`  - 评论: ${reviews.length}条`);

  console.log('\n🎉 完整数据库种子完成！');
  console.log('\n📝 测试账号:');
  console.log('  管理员: admin@yoyomall.com / admin123456');
  console.log('  用户1: user1@example.com / password123');
  console.log('  用户2: user2@example.com / password123');
  console.log('  用户3: user3@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ 种子失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

