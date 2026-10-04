import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, qrSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: "qr-session",
      name: "QR Session",
      credentials: {
        sessionId: { label: "Session ID", type: "text" },
        secretToken: { label: "Secret Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.sessionId || !credentials?.secretToken) return null;
        
        const qSession = await db.query.qrSessions.findFirst({
          where: and(
            eq(qrSessions.id, credentials.sessionId as string),
            eq(qrSessions.secretToken, credentials.secretToken as string),
            eq(qrSessions.status, "APPROVED")
          )
        });

        if (!qSession || !qSession.userId || qSession.expiresAt < new Date()) {
          return null;
        }

        // Mark as CONSUMED
        await db.update(qrSessions).set({ status: "CONSUMED" }).where(eq(qrSessions.id, qSession.id));

        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, qSession.userId)
        });

        if (!dbUser) return null;

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      const userId = (user?.id || token?.id || token?.sub) as string;
      if (session.user && userId) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, userId)
        });

        let currentRole = dbUser?.role || "WORKER";
        
        // HARDCODED SUPER ADMIN OVERRIDE
        if (dbUser?.email === process.env.ADMIN_EMAIL) {
          currentRole = "SUPER_ADMIN";
        }

        // @ts-ignore
        session.user.role = currentRole;
        session.user.id = userId;
        // @ts-ignore
        session.user.restaurantId = dbUser?.restaurantId || null;
      }
      return session;
    }
  }
});

