import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Built from the edge-safe config only — importing `auth` from @/lib/auth would
// pull Prisma and bcrypt into the middleware bundle, which runs on every request.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  // Public routes
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  if (publicRoutes.includes(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Root redirect — Dashboard is the landing page for all logged-in users
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/login", req.url)
    );
  }

  // Protected routes — require login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Dues Tracker is shared with residents; other /admin/* routes stay admin-only
  const sharedAdminRoutes = ["/admin/dues-tracker"];
  const isSharedAdminRoute = sharedAdminRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Admin-only routes
  if (pathname.startsWith("/admin") && !isAdmin && !isSharedAdminRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Static assets served out of /public (logos, icons, fonts) don't need an auth
  // check, so they skip middleware entirely rather than paying for a JWT decode.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|otf|txt|xml|webmanifest)$).*)",
  ],
};
