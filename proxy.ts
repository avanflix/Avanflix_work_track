import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth"];

const ADMIN_ONLY_PATHS = ["/dashboard/employees/new", "/dashboard/admins"];

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  const session = req.auth;

  // Not logged in -> send to login
  if (!session?.user) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Deactivated account -> block everything except login
  if ((session.user as any).isActive === false) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("disabled", "1");
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as any).role as string;

  // Route-level role protection for admin-only screens
  const requiresAdmin = ADMIN_ONLY_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  if (requiresAdmin && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // Employees cannot access the admin task-assignment / employee-management area
  if (nextUrl.pathname.startsWith("/dashboard/employees") && role === "EMPLOYEE") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/users/:path*",
    "/api/tasks/:path*",
    "/api/notifications/:path*",
    "/api/departments/:path*",
  ],
};
