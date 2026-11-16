import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("tabungane_session")?.value;

  // Redirect root /admin to /dashboard
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect Admin routes
  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const rawPayload = verifySession(sessionCookie);
    if (!rawPayload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      const payload = JSON.parse(rawPayload);
      const adminRoles = ["admin", "super_admin", "admin_kelas", "dekan", "kaprodi"];
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
    pathname.startsWith("/catatan") ||
    pathname.startsWith("/leaderboard")
  ) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const rawPayload = verifySession(sessionCookie);
    if (!rawPayload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      const payload = JSON.parse(rawPayload);
      if (payload.exp < Date.now()) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      const adminRoles = ["admin", "super_admin", "admin_kelas", "dekan", "kaprodi"];
      // Block admin from accessing /topup (student only)
      if (pathname.startsWith("/topup") && adminRoles.includes(payload.role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/topup/:path*",
    "/riwayat/:path*",
    "/grup/:path*",
    "/akun/:path*",
    "/leaderboard/:path*",
    "/catatan/:path*",
  ],
};
