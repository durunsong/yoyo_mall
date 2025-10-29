import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  // 动态配置URL，支持线上环境
  ...(process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL !== 'http://localhost:3000' 
    ? {} 
    : { 
        pages: {
          signIn: '/',
          signOut: '/',
        },
      }
  ),
  providers: [
    // Google OAuth 提供者
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    
    // 凭证提供者（邮箱+密码）
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('开始验证用户凭据:', { email: credentials?.email });
          
          if (!credentials?.email || !credentials?.password) {
            console.log('缺少邮箱或密码');
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          // 查找用户
          console.log('查找用户:', email);
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              avatar: true,
              role: true,
            },
          });

          if (!user || !user.password) {
            console.log('用户不存在或没有密码');
            return null;
          }

          // 验证密码
          console.log('验证密码');
          const isPasswordValid = await bcrypt.compare(
            password,
            user.password,
          );

          if (!isPasswordValid) {
            console.log('密码验证失败');
            return null;
          }

          console.log('用户验证成功:', user.email);

          // 返回用户信息
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            role: user.role,
          };
        } catch (error) {
          console.error('认证错误:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 天
    updateAge: 24 * 60 * 60, // 24小时更新一次session
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }: any) {
      // 登录时把必要字段写入 token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.avatar = user.image || user.avatar; // 支持两种字段名
      }

      // 客户端调用 useSession().update 时，合并最新的用户字段
      if (trigger === 'update' && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if ((session.user as any).avatar) token.avatar = (session.user as any).avatar;
        if ((session.user as any).image) token.avatar = (session.user as any).image;
      }
      
      // ⚡ 关键修复: 每次session请求时,从数据库刷新avatar
      // 这样可以确保头像更新后立即生效
      if (token.id && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { avatar: true, name: true, role: true },
          });
          
          if (dbUser) {
            // 更新token中的字段
            token.avatar = dbUser.avatar;
            token.name = dbUser.name;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('刷新token失败:', error);
          // 失败时保持原有token不变
        }
      }
      
      // Google 登录时保存提供者信息
      if (account?.provider === 'google') {
        token.provider = 'google';
      }
      
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.provider = token.provider;
        if (token.name) session.user.name = token.name;
        // 同时设置 avatar 和 image 字段,确保兼容性
        if (token.avatar) {
          (session.user as any).avatar = token.avatar;
          (session.user as any).image = token.avatar;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }: any) {
      try {
        // Google 登录的特殊处理
        if (account?.provider === 'google' && profile?.email) {
          // 检查是否已存在用户
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          // 如果用户不存在，创建新用户
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || '',
                avatar: (profile as any).picture || null,
                role: 'CUSTOMER',
                profile: {
                  create: {
                    firstName: (profile as any).given_name || '',
                    lastName: (profile as any).family_name || '',
                  },
                },
              },
            });
          } else if (!existingUser.avatar && (profile as any).picture) {
            // 更新头像（如果用户没有头像）
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { avatar: (profile as any).picture },
            });
          }
        }
        
        return true;
      } catch (error) {
        console.error('登录回调错误:', error);
        return false;
      }
    },
  },
  events: {
    async signIn({ user, account, isNewUser }: any) {
      console.log('用户登录:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
    async signOut({ token }: any) {
      console.log('用户登出:', token.email);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export const { GET, POST } = handlers;
