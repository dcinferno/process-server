import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecretKey() {
  if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return new TextEncoder().encode(JWT_SECRET);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Helper: redirect to login with callbackUrl
  const redirectToLogin = () => {
    const loginUrl = new URL(
      `/login?callbackUrl=${encodeURIComponent(pathname)}`,
      request.url
    );
    return NextResponse.redirect(loginUrl);
  };

  // Allow access to user creation page
  if (pathname === "/admin/users/create") {
    return NextResponse.next();
  }

  // Verify JWT if present
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecretKey());

      // Protect /admin routes
      if (pathname.startsWith("/admin")) {
        if (payload.role !== "admin") {
          return redirectToLogin();
        }
      }

      // Protect /process-server routes
      if (pathname.startsWith("/process-server")) {
        if (payload.role !== "process-server" && payload.role !== "admin") {
          return redirectToLogin();
        }
      }

      // Everything OK
      return NextResponse.next();
    } catch {
      // Invalid or expired token
      return redirectToLogin();
    }
  }

  // No token — redirect to login
  if (pathname.startsWith("/admin") || pathname.startsWith("/process-server")) {
    return redirectToLogin();
  }

  return NextResponse.next();
}

// Match both admin and process-server routes
export const config = {
  matcher: ["/admin/:path*", "/process-server/:path*"],
};
