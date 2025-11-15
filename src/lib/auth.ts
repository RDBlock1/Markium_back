// import NextAuth from 'next-auth';
// import { PrismaAdapter } from '@auth/prisma-adapter';
// import { prisma } from '@/db/prisma';
// import GoogleProvider from 'next-auth/providers/google';

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   trustHost: true,
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     GoogleProvider({
//       clientId: process.env.AUTH_GOOGLE_ID!,
//       clientSecret: process.env.AUTH_GOOGLE_SECRET!,
//       authorization: {
//         params: {
//           prompt: "consent",
//           access_type: "offline",
//           response_type: "code"
//         }
//       }
//     }),
//   ],
//   callbacks: {
//     async session({ session, user }) {
//       session.user.id = user.id;
//       return session;
//     }
//   },
//   secret: process.env.AUTH_SECRET,
//   cookies: {
//     pkceCodeVerifier: {
//       name: 'next-auth.pkce.code_verifier',
//       options: {
//         httpOnly: true,
//         sameSite: 'lax',
//         path: '/',
//         secure: true
//       }
//     }
//   }
// });


import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/db/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: false // Disable if only using OAuth
  },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
  },
  trustedOrigins: [
    "https://markiumpro.com",
    process.env.NEXT_PUBLIC_BASE_URL!,
  ],
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,
  secret: process.env.AUTH_SECRET!,
    advanced: {
 useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "auth",
    crossSubDomainCookies: {
      enabled: true,
    },

      // This prevents state mismatches
      database: {
        generateId: () => crypto.randomUUID(),
    },

  },



});

