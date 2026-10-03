import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        
        // NextAuth strips custom columns by default. 
        // We must fetch the fresh row from our database to get the restaurantId!
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id)
        });

        let currentRole = dbUser?.role || "WORKER";
        
        // HARDCODED SUPER ADMIN OVERRIDE
        if (user.email === process.env.ADMIN_EMAIL) {
          currentRole = "SUPER_ADMIN";
        }

        // @ts-ignore
        session.user.role = currentRole;
        session.user.id = user.id;
        // @ts-ignore
        session.user.restaurantId = dbUser?.restaurantId || null;
      }
      return session;
    }
  }
});
