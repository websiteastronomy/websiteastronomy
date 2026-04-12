import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { users, sessions, accounts, verifications } from "@/db/schema";
import { getAppBaseUrl, getBetterAuthSecret, getTrustedOrigins } from "@/lib/env";

export const auth = betterAuth({
    baseURL: process.env.NEXTAUTH_URL || getAppBaseUrl(),
    secret: getBetterAuthSecret(),
    trustedOrigins: getTrustedOrigins(),
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: users,
            session: sessions,
            account: accounts,
            verification: verifications,
        },
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }
    },
    emailAndPassword: {
        enabled: true,
    },
});
