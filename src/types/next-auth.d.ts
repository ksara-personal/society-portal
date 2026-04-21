import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      wing: string | null;
      flatNo: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    wing: string | null;
    flatNo: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    wing: string | null;
    flatNo: string | null;
  }
}
