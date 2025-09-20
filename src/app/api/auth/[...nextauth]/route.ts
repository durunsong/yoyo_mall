import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
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
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          // 查找用户
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
            return null;
          }

          // 验证密码
          const isPasswordValid = await bcrypt.compare(
            password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

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
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }: any) {
      // 登录时把必要字段写入 token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image;
      }

      // 客户端调用 useSession().update 时，合并最新的用户字段
      if (trigger === 'update' && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if ((session.user as any).image) token.picture = (session.user as any).image;
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
        if ((token as any).picture) (session.user as any).image = (token as any).picture;
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
