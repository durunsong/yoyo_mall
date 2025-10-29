/**
 * 用户头像上传 API
 * 使用阿里云 OSS 存储
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { oss, OSS_FOLDERS } from '@/lib/oss-improved';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 },
      );
    }

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '请上传文件' },
        { status: 400 },
      );
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '只能上传图片文件' },
        { status: 400 },
      );
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '图片大小不能超过 5MB' },
        { status: 400 },
      );
    }

    console.log('开始上传头像:', {
      userId: session.user.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // 转换 File 为 Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 上传到 OSS
    const uploadResult = await oss.upload({
      file: buffer,
      filename: file.name,
      folder: OSS_FOLDERS.AVATARS,
      compress: true, // 压缩图片
      generateThumbnail: true, // 生成缩略图
      thumbnailSize: { width: 200, height: 200 },
      quality: 85,
      maxSize: 5 * 1024 * 1024,
    });

    console.log('头像上传成功:', uploadResult);

    // 获取用户当前头像
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    });

    // 如果存在旧头像，删除它
    if (currentUser?.avatar) {
      try {
        // 从URL提取key
        const oldAvatarUrl = new URL(currentUser.avatar);
        const oldAvatarKey = oldAvatarUrl.pathname.substring(1); // 移除开头的 /
        await oss.delete(oldAvatarKey);
        console.log('旧头像删除成功:', oldAvatarKey);
      } catch (error) {
        console.warn('删除旧头像失败:', error);
        // 不影响主流程
      }
    }

    // 更新用户头像URL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: uploadResult.url },
    });

    console.log('用户头像更新成功:', {
      userId: session.user.id,
      avatarUrl: uploadResult.url,
    });

    return NextResponse.json({
      success: true,
      message: '头像上传成功',
      avatarUrl: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
    });
  } catch (error) {
    console.error('头像上传失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: '头像上传失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 },
    );
  }
}

// 删除头像
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 },
      );
    }

    // 获取用户当前头像
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    });

    if (!currentUser?.avatar) {
      return NextResponse.json(
        { success: false, error: '没有头像可删除' },
        { status: 400 },
      );
    }

    // 从URL提取key并删除
    try {
      const avatarUrl = new URL(currentUser.avatar);
      const avatarKey = avatarUrl.pathname.substring(1);
      await oss.delete(avatarKey);
    } catch (error) {
      console.warn('删除OSS头像失败:', error);
    }

    // 更新数据库，设置为null
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: null },
    });

    console.log('头像删除成功:', session.user.id);

    return NextResponse.json({
      success: true,
      message: '头像删除成功',
    });
  } catch (error) {
    console.error('删除头像失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: '删除头像失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 },
    );
  }
}

