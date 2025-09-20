import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 可选安全措施：仅开发环境或提供管理员种子密钥
    const allowInProd = process.env.SEED_ADMIN_SECRET && request.headers.get('x-seed-secret') === process.env.SEED_ADMIN_SECRET;
    if (process.env.NODE_ENV !== 'development' && !allowInProd) {
      return NextResponse.json({ success: false, message: 'Not allowed' }, { status: 403 });
    }

    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'email/password required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
      return NextResponse.json({ success: true, message: 'User promoted to ADMIN' });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name: name || 'Admin',
        password: hashed,
        role: 'ADMIN',
        profile: { create: {} },
      },
    });

    return NextResponse.json({ success: true, message: 'Admin user created' });
  } catch (error) {
    console.error('create-admin error:', error);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}


