import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

// Node-only half of the config. The PrismaAdapter is deliberately absent: it is
// unused under the JWT session strategy (there are no Account/Session tables in
// the schema) and importing it drags the whole client into the auth bundle.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        if (user.approvalStatus === "PENDING") return null;
        if (user.approvalStatus === "REJECTED") return null;

        // Record last login time (fire-and-forget, don't block auth)
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }).catch(() => {});

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          wing: user.wing,
          flatNo: user.flatNo,
        };
      },
    }),
  ],
});
