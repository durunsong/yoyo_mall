import { prisma } from '@/lib/prisma';

// 基础分类数据
const categories = [
  {
    name: '数码电子',
    slug: 'electronics',
    description: '手机、电脑、相机等数码产品',
    isActive: true,
    sortOrder: 1,
    children: [
      { name: '手机', slug: 'phones', sortOrder: 1 },
      { name: '电脑', slug: 'computers', sortOrder: 2 },
      { name: '相机', slug: 'cameras', sortOrder: 3 },
    ],
  },
  {
    name: '时尚服饰',
    slug: 'fashion',
    description: '服装、鞋子、配饰等时尚用品',
    isActive: true,
    sortOrder: 2,
    children: [
      { name: '男装', slug: 'mens-clothing', sortOrder: 1 },
      { name: '女装', slug: 'womens-clothing', sortOrder: 2 },
      { name: '鞋子', slug: 'shoes', sortOrder: 3 },
    ],
  },
  {
    name: '家居生活',
    slug: 'home-living',
    description: '家具、家电、装饰等家居用品',
    isActive: true,
    sortOrder: 3,
    children: [
      { name: '家具', slug: 'furniture', sortOrder: 1 },
      { name: '家电', slug: 'appliances', sortOrder: 2 },
      { name: '装饰', slug: 'decor', sortOrder: 3 },
    ],
  },
  {
    name: '美妆护肤',
    slug: 'beauty',
    description: '化妆品、护肤品、香水等美妆产品',
    isActive: true,
    sortOrder: 4,
    children: [
      { name: '护肤', slug: 'skincare', sortOrder: 1 },
      { name: '彩妆', slug: 'makeup', sortOrder: 2 },
      { name: '香水', slug: 'fragrance', sortOrder: 3 },
    ],
  },
];

// 基础品牌数据
const brands = [
  { name: 'Apple', slug: 'apple', description: '创新科技品牌' },
  { name: 'Samsung', slug: 'samsung', description: '全球电子品牌' },
  { name: 'Nike', slug: 'nike', description: '运动品牌' },
  { name: 'Adidas', slug: 'adidas', description: '德国运动品牌' },
  { name: 'IKEA', slug: 'ikea', description: '瑞典家居品牌' },
  { name: 'Zara', slug: 'zara', description: '西班牙快时尚品牌' },
];

// 示例商品数据
const getProductsByCategory = (categoryId: string, categoryName: string) => {
  const baseProducts = {
    'electronics': [
      {
        name: 'iPhone 15 Pro',
        description: '最新款iPhone，搭载A17 Pro芯片',
        shortDesc: '6.1英寸超视网膜XDR显示屏',
        sku: 'IPHONE15PRO-128',
        price: 999.00,
        comparePrice: 1099.00,
        status: 'PUBLISHED',
        tags: ['手机', '苹果', '5G'],
      },
      {
        name: 'MacBook Air M3',
        description: '搭载M3芯片的轻薄笔记本',
        shortDesc: '13.6英寸Liquid视网膜显示屏',
        sku: 'MBA-M3-256',
        price: 1299.00,
        status: 'PUBLISHED',
        tags: ['笔记本', '苹果', 'M3'],
      },
    ],
    'fashion': [
      {
        name: 'Nike Air Max 270',
        description: '舒适的运动鞋，适合日常穿着',
        shortDesc: '轻量化设计，出色缓震',
        sku: 'NIKE-AM270-BLK-42',
        price: 129.99,
        status: 'PUBLISHED',
        tags: ['运动鞋', '耐克', '气垫'],
      },
      {
        name: 'Zara 基础T恤',
        description: '100%纯棉基础T恤，多色可选',
        shortDesc: '经典圆领设计，舒适面料',
        sku: 'ZARA-TEE-BLK-M',
        price: 19.99,
        status: 'PUBLISHED',
        tags: ['T恤', 'Zara', '纯棉'],
      },
    ],
    'home-living': [
      {
        name: 'IKEA POÄNG 扶手椅',
        description: '经典设计的舒适扶手椅',
        shortDesc: '桦木贴面，棉质坐垫',
        sku: 'IKEA-POANG-BIRCH',
        price: 89.99,
        status: 'PUBLISHED',
        tags: ['椅子', 'IKEA', '桦木'],
      },
    ],
    'beauty': [
      {
        name: '兰蔻小黑瓶精华',
        description: '肌底精华，改善肌肤质地',
        shortDesc: '30ml 修护精华',
        sku: 'LANCOME-SERUM-30ML',
        price: 89.99,
        status: 'PUBLISHED',
        tags: ['精华', '兰蔻', '护肤'],
      },
    ],
  };

  return baseProducts[categoryName as keyof typeof baseProducts] || [];
};

export async function seedDatabase() {
  console.log('开始初始化数据库...');

  try {
    // 1. 创建品牌
    console.log('创建品牌...');
    const createdBrands = await Promise.all(
      brands.map(async (brand) => {
        return prisma.brand.upsert({
          where: { slug: brand.slug },
          update: brand,
          create: brand,
        });
      })
    );
    console.log(`创建了 ${createdBrands.length} 个品牌`);

    // 2. 创建分类
    console.log('创建分类...');
    for (const category of categories) {
      const { children, ...categoryData } = category;
      
      // 创建父级分类
      const parentCategory = await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: categoryData,
        create: categoryData,
      });

      // 创建子分类
      if (children && children.length > 0) {
        await Promise.all(
          children.map(async (child) => {
            return prisma.category.upsert({
              where: { slug: child.slug },
              update: { ...child, parentId: parentCategory.id },
              create: { ...child, parentId: parentCategory.id, isActive: true, description: '' },
            });
          })
        );
      }
    }
    console.log('分类创建完成');

    // 3. 创建示例商品
    console.log('创建示例商品...');
    const allCategories = await prisma.category.findMany({
      where: { parentId: { not: null } }, // 只取子分类
    });

    let productCount = 0;
    for (const category of allCategories) {
      const parent = await prisma.category.findUnique({
        where: { id: category.parentId! },
      });
      
      if (!parent) continue;

      const products = getProductsByCategory(category.id, parent.slug);
      
      for (const product of products) {
        // 找到对应的品牌
        const brandName = product.tags.find(tag => 
          createdBrands.some(brand => brand.name.toLowerCase() === tag.toLowerCase())
        );
        const brand = brandName ? createdBrands.find(b => b.name.toLowerCase() === brandName.toLowerCase()) : null;

        const createdProduct = await prisma.product.create({
          data: {
            ...product,
            categoryId: category.id,
            brandId: brand?.id,
            slug: product.name.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .trim(),
          },
        });

        // 创建库存记录
        if (createdProduct.trackInventory) {
          await prisma.inventory.create({
            data: {
              productId: createdProduct.id,
              quantity: Math.floor(Math.random() * 100) + 50, // 随机库存 50-150
              reservedQuantity: 0,
              lowStockThreshold: 10,
            },
          });
        }

        productCount++;
      }
    }
    console.log(`创建了 ${productCount} 个商品`);

    // 4. 创建示例优惠券
    console.log('创建示例优惠券...');
    const coupons = [
      {
        code: 'WELCOME10',
        name: '新用户欢迎券',
        description: '新用户专享10%折扣',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 50,
        maxDiscount: 20,
        usageLimit: 1000,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        isActive: true,
      },
      {
        code: 'FREESHIP',
        name: '免运费券',
        description: '满$50免运费',
        type: 'FREE_SHIPPING',
        value: 0,
        minOrderAmount: 50,
        usageLimit: 500,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60天后过期
        isActive: true,
      },
    ];

    for (const coupon of coupons) {
      await prisma.coupon.upsert({
        where: { code: coupon.code },
        update: coupon,
        create: { ...coupon, usageCount: 0 },
      });
    }
    console.log(`创建了 ${coupons.length} 个优惠券`);

    console.log('数据库初始化完成！');
    return {
      success: true,
      message: '数据库初始化完成',
      stats: {
        brands: createdBrands.length,
        categories: categories.length,
        products: productCount,
        coupons: coupons.length,
      },
    };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}
