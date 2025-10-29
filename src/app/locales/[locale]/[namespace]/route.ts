/**
 * 静态翻译文件路由
 * 为客户端组件提供翻译文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; namespace: string }> },
) {
  try {
    // Next.js 15 要求await params
    const { locale, namespace } = await params;
    
    console.log(`🌐 Loading translation: ${locale}/${namespace}.json`);
    
    // 验证语言和命名空间
    const allowedLocales = ['zh-CN', 'en-US'];
    const allowedNamespaces = ['common', 'navigation', 'product', 'cart', 'auth', 'admin', 'error'];
    
    if (!allowedLocales.includes(locale)) {
      console.error(`❌ Invalid locale: ${locale}`);
      return NextResponse.json({ error: 'Invalid locale', locale }, { status: 404 });
    }
    
    if (!allowedNamespaces.includes(namespace)) {
      console.error(`❌ Invalid namespace: ${namespace}`);
      return NextResponse.json({ error: 'Invalid namespace', namespace }, { status: 404 });
    }

    // 构建文件路径
    const filePath = join(process.cwd(), 'src', 'locales', locale, `${namespace}.json`);
    console.log(`📁 File path: ${filePath}`);
    
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      console.error(`❌ File does not exist: ${filePath}`);
      return NextResponse.json({ 
        error: 'Translation file not found', 
        path: filePath,
        locale,
        namespace,
      }, { status: 404 });
    }
    
    // 读取文件内容
    const fileContent = await readFile(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);

    console.log(`✅ Successfully loaded ${locale}/${namespace} with ${Object.keys(translations).length} keys`);

    return NextResponse.json(translations, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('💥 Error loading translation file:', error);
    return NextResponse.json({ 
      error: 'Failed to load translation file', 
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
