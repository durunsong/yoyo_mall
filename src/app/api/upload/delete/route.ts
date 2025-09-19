/**
 * 文件删除API接口
 * 支持单文件和批量删除
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, deleteFiles } from '@/lib/oss';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, keys } = body;

    // 验证输入
    if (!key && (!keys || !Array.isArray(keys) || keys.length === 0)) {
      return NextResponse.json(
        { error: '请提供要删除的文件key或keys数组' },
        { status: 400 }
      );
    }

    // 单文件删除
    if (key) {
      try {
        await deleteFile(key);
        return NextResponse.json({
          success: true,
          message: '文件删除成功',
          deletedKey: key,
        });
      } catch (error) {
        console.error('删除文件失败:', error);
        return NextResponse.json(
          { 
            error: '删除文件失败',
            message: error instanceof Error ? error.message : '未知错误'
          },
          { status: 500 }
        );
      }
    }

    // 批量删除
    if (keys && Array.isArray(keys)) {
      try {
        await deleteFiles(keys);
        return NextResponse.json({
          success: true,
          message: `成功删除 ${keys.length} 个文件`,
          deletedKeys: keys,
        });
      } catch (error) {
        console.error('批量删除文件失败:', error);
        return NextResponse.json(
          { 
            error: '批量删除文件失败',
            message: error instanceof Error ? error.message : '未知错误'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: '无效的请求参数' },
      { status: 400 }
    );
  } catch (error) {
    console.error('文件删除API错误:', error);
    return NextResponse.json(
      { 
        error: '服务器错误',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 支持的HTTP方法说明
export async function GET() {
  return NextResponse.json({
    message: '文件删除API',
    supportedMethods: ['DELETE'],
    usage: {
      singleFile: {
        method: 'DELETE',
        body: { key: 'file-key-to-delete' },
      },
      multipleFiles: {
        method: 'DELETE',
        body: { keys: ['key1', 'key2', 'key3'] },
      },
    },
  });
}
