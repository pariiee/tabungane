import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("tabungane_session")?.value;

  // Protect Admin routes
  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      const [encoded] = sessionCookie.split(".");
      if (!encoded) return NextResponse.redirect(new URL("/login", request.url));
      const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
      const adminRoles = ["admin", "super_admin", "admin_kelas"];
      if (payload.exp < Date.now()) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      if (!adminRoles.includes(payload.role)) {
        return NextResponse.redirect(new URL("/error?code=403", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect Student pages & Leaderboard
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/topup") ||
    pathname.startsWith("/riwayat") ||
    pathname.startsWith("/grup") ||
    pathname.startsWith("/akun") ||
    pathname.startsWith("/leaderboard")
  ) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      const [encoded] = sessionCookie.split(".");
      if (!encoded) return NextResponse.redirect(new URL("/login", request.url));
      const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.exp < Date.now()) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/topup/:path*",
    "/riwayat/:path*",
    "/grup/:path*",
    "/akun/:path*",
    "/leaderboard/:path*",
  ],
};
