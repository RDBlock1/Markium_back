export const runtime = 'nodejs'; // ens ure Node.js runtime
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db/prisma';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
 profile(profile) {
  console.log('Signing in with email:', profile.email);
  return {
    id: profile.sub,
    name: profile.name,
    email: profile.email,
    image: profile.picture,
  };
}
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.provider = account!.provider;

      } 
      return token;
    },

    async session({ session }) {
      return session;
    },
     async redirect({ url, baseUrl }) {
    // ✅ always redirect to dashboard (or homepage)
    return baseUrl 

    // OR → if you want to allow callbackUrl query params
    // if (url.startsWith(baseUrl)) return url;
    // return baseUrl + "/dashboard";
  },
  },

  events: {
    async createUser({ user }) {
      console.log('⛏️ createUser →', user);
    },
    async linkAccount({ account }) {
      console.log('🔗 linkAccount →', account);
    },
    async signIn({ user, account, isNewUser }) {
      console.log(
        '✅ signIn →',
        user.email,
        'via',
        account?.provider,
        'new?',
        isNewUser
      );


    },
  },
});
