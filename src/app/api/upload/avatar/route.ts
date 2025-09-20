import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/oss';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取上传的文件
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: '未找到文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: '只支持图片文件' },
        { status: 400 }
      );
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: '文件大小不能超过5MB' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const fileName = `avatar_${session.user.id}_${uuidv4()}.webp`;
    
    // 上传到阿里云 OSS
    const result = await uploadFile({
      file: file,
      filename: fileName,
      folder: 'avatars',
      compress: true,
      quality: 85,
      maxWidth: 400,
      maxHeight: 400,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || '上传失败' },
        { status: 500 }
      );
    }

    const avatarUrl = result.url!;

    // 更新用户头像
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
    });

    console.log('头像上传成功:', {
      userId: session.user.id,
      fileName,
      avatarUrl,
      originalSize: file.size,
      compressedSize: result.size,
    });

    return NextResponse.json({
      success: true,
      url: avatarUrl,
      message: '头像上传成功',
      fileInfo: {
        originalSize: file.size,
        compressedSize: result.size || 0,
        format: 'webp',
      },
    });

  } catch (error) {
    console.error('头像上传失败:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '上传失败，请重试' 
      },
      { status: 500 }
    );
  }
}