


import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {prisma} from "@/db/prisma"

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

