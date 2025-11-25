import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

// Database
import { db } from "@/database";

// Constants
import { APP_NAME } from "@/lib/constants";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    cookiePrefix: APP_NAME,
    useSecureCookies: true,
  },
  plugins: [nextCookies()], // make sure this is the last plugin in the array
});
