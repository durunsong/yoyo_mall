/**
 * 批量更新占位图引用
 * 将所有 /placeholder.png 替换为使用环境变量的OSS URL
 */

const fs = require('fs');
const path = require('path');

// 使用环境变量的OSS占位图引用
const OSS_PLACEHOLDER = '`${process.env.NEXT_PUBLIC_OSS_BASE_URL || process.env.BASE_OSS_URL}/${process.env.OSS_FOLDER || \'yoyo_mall\'}/placeholder.png`';

// 需要更新的文件列表
const filesToUpdate = [
  'src/app/deals/page.tsx',
  'src/app/products/page.tsx',
  'src/app/products/[id]/page.tsx',
  'src/app/[locale]/page.tsx',
  'src/app/account/wishlist/page.tsx',
  'src/components/seo/seo-metadata.tsx',
  'src/components/products/product-card.tsx',
  'src/components/admin/image-upload.tsx',
  'src/app/account/orders/page.tsx',
  'src/app/cart/page.tsx',
];

// 替换模式
const patterns = [
  {
    from: /['"]\/placeholder\.png['"]/g,
    to: `'${OSS_PLACEHOLDER}'`,
    description: '替换 /placeholder.png',
  },
  {
    from: /image\s*\|\|\s*['"]\/placeholder\.png['"]/g,
    to: `image || '${OSS_PLACEHOLDER}'`,
    description: '替换 image || /placeholder.png',
  },
  {
    from: /product\.image\s*\|\|\s*['"]\/placeholder\.png['"]/g,
    to: `product.image || '${OSS_PLACEHOLDER}'`,
    description: '替换 product.image || /placeholder.png',
  },
  {
    from: /item\.image\s*\|\|\s*['"]\/placeholder\.png['"]/g,
    to: `item.image || '${OSS_PLACEHOLDER}'`,
    description: '替换 item.image || /placeholder.png',
  },
];

function updateFile(filePath) {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  跳过不存在的文件: ${filePath}`);
      return false;
    }

    // 读取文件
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changed = false;

    // 应用所有替换模式
    for (const pattern of patterns) {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        console.log(`  ✅ ${pattern.description}`);
        changed = true;
      }
    }

    // 如果内容有变化，写回文件
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 已更新: ${filePath}`);
      return true;
    } else {
      console.log(`  ℹ️  无需更新: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 更新失败 (${filePath}):`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 开始批量更新占位图引用...\n');
  console.log(`📝 目标: ${OSS_PLACEHOLDER}\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const file of filesToUpdate) {
    console.log(`\n📄 处理文件: ${file}`);
    const updated = updateFile(file);
    if (updated) {
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ 更新完成！`);
  console.log(`  - 已更新: ${updatedCount} 个文件`);
  console.log(`  - 跳过: ${skippedCount} 个文件`);
  console.log(`\n💡 提示: 请运行 npm run lint 检查代码质量`);
  console.log('');
}

// 执行
main();

