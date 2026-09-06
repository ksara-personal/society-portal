import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the Auth.js config: session strategy, pages and the
 * token/session callbacks, with no providers and — crucially — no Prisma or
 * bcrypt imports. middleware.ts builds its own NextAuth instance from this so
 * the database client never ends up in the bundle that runs on every request.
 *
 * The full config in ./auth.ts spreads this and adds the Credentials provider.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role;
        token.wing = (user as any).wing;
        token.flatNo = (user as any).flatNo;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.wing = token.wing as string | null;
        session.user.flatNo = token.flatNo as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
