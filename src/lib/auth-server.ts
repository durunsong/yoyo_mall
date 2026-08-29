import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  pages: { signIn: '/', signOut: '/' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const email = credentials.email as string;
          const password = credentials.password as string;
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, password: true, avatar: true, role: true },
          });
          if (!user?.password) return null;
          if (!(await bcrypt.compare(password, user.password))) return null;
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
  session: { strategy: 'jwt' as const, maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user, account, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.avatar = user.image || user.avatar;
      }
      if (trigger === 'update') {
        const updatedUser = session?.user ?? session;
        if (updatedUser) {
          if (updatedUser.name) token.name = updatedUser.name;
          if (updatedUser.avatar) token.avatar = updatedUser.avatar;
          if (updatedUser.image) token.avatar = updatedUser.image;
        }
      }
      if (account?.provider === 'google') token.provider = 'google';
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.provider = token.provider;
        if (token.name) session.user.name = token.name;
        if (token.avatar) {
          session.user.avatar = token.avatar;
          session.user.image = token.avatar;
        }
      }
      return session;
    },
    async signIn({ account, profile }: any) {
      try {
        if (account?.provider === 'google' && profile?.email) {
          const existingUser = await prisma.user.findUnique({ where: { email: profile.email } });
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || '',
                avatar: profile.picture || null,
                role: 'CUSTOMER',
                profile: {
                  create: {
                    firstName: profile.given_name || '',
                    lastName: profile.family_name || '',
                  },
                },
              },
            });
          } else if (!existingUser.avatar && profile.picture) {
            await prisma.user.update({ where: { id: existingUser.id }, data: { avatar: profile.picture } });
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
      console.log('用户登录:', { userId: user.id, email: user.email, provider: account?.provider, isNewUser });
    },
    async signOut({ token }: any) {
      console.log('用户登出:', token.email);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

const nextAuth = NextAuth(authConfig);

export const { handlers, auth, signIn, signOut } = nextAuth;
