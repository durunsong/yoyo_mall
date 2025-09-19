/**
 * 静态翻译文件路由
 * 为客户端组件提供翻译文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string; namespace: string } }
) {
  try {
    const { locale, namespace } = params;
    
    // 验证语言和命名空间
    const allowedLocales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
    const allowedNamespaces = ['common', 'navigation', 'product', 'cart', 'auth', 'admin', 'error'];
    
    if (!allowedLocales.includes(locale) || !allowedNamespaces.includes(namespace)) {
      return NextResponse.json({ error: 'Invalid locale or namespace' }, { status: 404 });
    }

    // 读取翻译文件
    const filePath = join(process.cwd(), 'src', 'locales', locale, `${namespace}.json`);
    const fileContent = await readFile(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);

    return NextResponse.json(translations, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
      },
    });
  } catch (error) {
    console.error('Error loading translation file:', error);
    return NextResponse.json({ error: 'Translation file not found' }, { status: 404 });
  }
}
