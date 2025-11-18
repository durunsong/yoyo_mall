/**
 * Footer配置初始数据种子
 * 为Footer区块、链接、联系信息和社交媒体创建默认数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedFooterConfig() {
  console.log('🌱 开始创建Footer配置初始数据...');

  try {
    // 1. 创建Footer区块
    const companySection = await prisma.footerSection.upsert({
      where: { key: 'company' },
      update: {},
      create: {
        key: 'company',
        title: 'Company',
        titleEn: 'Company',
        titleZh: '公司',
        sortOrder: 0,
        isActive: true,
      },
    });

    const customerSection = await prisma.footerSection.upsert({
      where: { key: 'customer' },
      update: {},
      create: {
        key: 'customer',
        title: 'Customer Service',
        titleEn: 'Customer Service',
        titleZh: '客户服务',
        sortOrder: 1,
        isActive: true,
      },
    });

    const accountSection = await prisma.footerSection.upsert({
      where: { key: 'account' },
      update: {},
      create: {
        key: 'account',
        title: 'My Account',
        titleEn: 'My Account',
        titleZh: '我的账户',
        sortOrder: 2,
        isActive: true,
      },
    });

    const legalSection = await prisma.footerSection.upsert({
      where: { key: 'legal' },
      update: {},
      create: {
        key: 'legal',
        title: 'Legal',
        titleEn: 'Legal',
        titleZh: '法律',
        sortOrder: 3,
        isActive: true,
      },
    });

    console.log('✅ Footer区块创建成功');

    // 2. 创建Company区块的链接
    await prisma.footerLink.createMany({
      data: [
        {
          sectionId: companySection.id,
          name: 'About Us',
          nameEn: 'About Us',
          nameZh: '关于我们',
          href: '/about',
          sortOrder: 0,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: companySection.id,
          name: 'Contact Us',
          nameEn: 'Contact Us',
          nameZh: '联系我们',
          href: '/contact',
          sortOrder: 1,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: companySection.id,
          name: 'Careers',
          nameEn: 'Careers',
          nameZh: '加入我们',
          href: '/careers',
          sortOrder: 2,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: companySection.id,
          name: 'Newsroom',
          nameEn: 'Newsroom',
          nameZh: '新闻中心',
          href: '/news',
          sortOrder: 3,
          isActive: true,
          openInNew: false,
        },
      ],
      skipDuplicates: true,
    });

    // 3. 创建Customer Service区块的链接
    await prisma.footerLink.createMany({
      data: [
        {
          sectionId: customerSection.id,
          name: 'Help Center',
          nameEn: 'Help Center',
          nameZh: '帮助中心',
          href: '/help',
          sortOrder: 0,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: customerSection.id,
          name: 'Shipping Information',
          nameEn: 'Shipping Information',
          nameZh: '配送信息',
          href: '/shipping',
          sortOrder: 1,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: customerSection.id,
          name: 'Return Policy',
          nameEn: 'Return Policy',
          nameZh: '退货政策',
          href: '/returns',
          sortOrder: 2,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: customerSection.id,
          name: 'FAQ',
          nameEn: 'FAQ',
          nameZh: '常见问题',
          href: '/faq',
          sortOrder: 3,
          isActive: true,
          openInNew: false,
        },
      ],
      skipDuplicates: true,
    });

    // 4. 创建My Account区块的链接
    await prisma.footerLink.createMany({
      data: [
        {
          sectionId: accountSection.id,
          name: 'My Orders',
          nameEn: 'My Orders',
          nameZh: '我的订单',
          href: '/account/orders',
          sortOrder: 0,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: accountSection.id,
          name: 'Wishlist',
          nameEn: 'Wishlist',
          nameZh: '心愿单',
          href: '/account/wishlist',
          sortOrder: 1,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: accountSection.id,
          name: 'Account Settings',
          nameEn: 'Account Settings',
          nameZh: '账户设置',
          href: '/account/settings',
          sortOrder: 2,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: accountSection.id,
          name: 'Address Book',
          nameEn: 'Address Book',
          nameZh: '地址簿',
          href: '/account/addresses',
          sortOrder: 3,
          isActive: true,
          openInNew: false,
        },
      ],
      skipDuplicates: true,
    });

    // 5. 创建Legal区块的链接
    await prisma.footerLink.createMany({
      data: [
        {
          sectionId: legalSection.id,
          name: 'Terms of Service',
          nameEn: 'Terms of Service',
          nameZh: '服务条款',
          href: '/terms',
          sortOrder: 0,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: legalSection.id,
          name: 'Privacy Policy',
          nameEn: 'Privacy Policy',
          nameZh: '隐私政策',
          href: '/privacy',
          sortOrder: 1,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: legalSection.id,
          name: 'Cookie Policy',
          nameEn: 'Cookie Policy',
          nameZh: 'Cookie政策',
          href: '/cookies',
          sortOrder: 2,
          isActive: true,
          openInNew: false,
        },
        {
          sectionId: legalSection.id,
          name: 'Disclaimer',
          nameEn: 'Disclaimer',
          nameZh: '免责声明',
          href: '/disclaimer',
          sortOrder: 3,
          isActive: true,
          openInNew: false,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Footer链接创建成功');

    // 6. 创建联系信息
    await prisma.footerContact.createMany({
      data: [
        {
          type: 'email',
          label: 'Email',
          labelEn: 'Email',
          labelZh: '邮箱',
          value: 'support@yoyomall.com',
          icon: 'Mail',
          sortOrder: 0,
          isActive: true,
        },
        {
          type: 'phone',
          label: 'Phone',
          labelEn: 'Phone',
          labelZh: '电话',
          value: '+1 (555) 123-4567',
          icon: 'Phone',
          sortOrder: 1,
          isActive: true,
        },
        {
          type: 'address',
          label: 'Address',
          labelEn: 'Address',
          labelZh: '地址',
          value: '123 Business Street, City, State 12345',
          icon: 'MapPin',
          sortOrder: 2,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Footer联系信息创建成功');

    // 7. 创建社交媒体链接
    await prisma.footerSocial.createMany({
      data: [
        {
          name: 'Facebook',
          icon: 'Facebook',
          href: 'https://facebook.com',
          color: 'hover:text-blue-600',
          sortOrder: 0,
          isActive: true,
        },
        {
          name: 'Twitter',
          icon: 'Twitter',
          href: 'https://twitter.com',
          color: 'hover:text-blue-400',
          sortOrder: 1,
          isActive: true,
        },
        {
          name: 'Instagram',
          icon: 'Instagram',
          href: 'https://instagram.com',
          color: 'hover:text-pink-500',
          sortOrder: 2,
          isActive: true,
        },
        {
          name: 'YouTube',
          icon: 'Youtube',
          href: 'https://youtube.com',
          color: 'hover:text-red-600',
          sortOrder: 3,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Footer社交媒体链接创建成功');
    console.log('✅ Footer配置初始数据创建完成!');
  } catch (error) {
    console.error('❌ Footer配置初始数据创建失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFooterConfig()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

